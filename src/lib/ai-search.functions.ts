import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { filtersSchema, likePattern, normalizeRef, type SearchFilter } from "./ai-search.schema";

const MODEL = "openai/gpt-6-astra";

const SYSTEM = `You convert a dental clinic staff member's patient-search request (Arabic or English) into structured filters.
You never see patient data. Output only the JSON schema.
Available fields and operators (nothing else exists):
- full_name: "contains" (partial name) or "equals" (only when the user clearly gives a complete exact name in quotes). Keep the name in the language/script the user wrote it. Prefer "contains".
- reference_id: "equals". Patient IDs look like "P-1025"; copy whatever ID the user gives, uppercase.
- phone: "contains" (digits only).
- visit_date: "between" — patients with at least one recorded visit in the inclusive date range value..value_to (YYYY-MM-DD).
- last_visit_date: "between" — patients whose MOST RECENT visit falls in the range.
Resolve relative dates using today's date provided. "Last month"/"الشهر الماضي" means the last 30 days ending today unless the user says "previous calendar month". If a year is missing, use the most recent past occurrence.
value_to must be null for non-date filters.
status:
- "search" when you produced at least one filter.
- "clarify" when the request is too vague to search (e.g. "find a patient", "show me someone"), or a date range is ambiguous. Put a short question in "message" in the SAME language as the request.
- "unsupported" when it asks for data that does not exist (age, diagnosis, treatment type, allergies, gender, city, X-ray content, medical advice). Explain briefly in "message" in the request's language which criteria are supported: name, patient ID, phone, visit dates.
Never give medical advice. Never invent filters.`;

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["status", "message", "filters"],
  properties: {
    status: { type: "string", enum: ["search", "clarify", "unsupported"] },
    message: { type: "string" },
    filters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["field", "operator", "value", "value_to"],
        properties: {
          field: { type: "string", enum: ["full_name", "reference_id", "phone", "visit_date", "last_visit_date"] },
          operator: { type: "string", enum: ["contains", "equals", "between"] },
          value: { type: "string" },
          value_to: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

export type Interpretation =
  | { status: "search"; filters: SearchFilter[] }
  | { status: "clarify" | "unsupported"; message: string };

async function callModel(query: string, apiKey: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: SYSTEM,
      input: [{ role: "user", content: `Today is ${today}.\nRequest: ${query}` }],
      text: { format: { type: "json_schema", name: "patient_search", strict: true, schema: OUTPUT_SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    console.error("[ai-search] gateway status", res.status);
    if (res.status === 401) throw new Error("AI_CONFIG");
    if (res.status === 402) throw new Error("AI_CREDITS");
    if (res.status === 429) throw new Error("AI_BUSY");
    throw new Error("AI_DOWN");
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, i); buf = buf.slice(i + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") out += ev.delta;
          else if (ev.type === "response.failed" || ev.type === "error") throw new Error("AI_DOWN");
        } catch (e) { if (e instanceof Error && e.message === "AI_DOWN") throw e; }
      }
    }
  }
  return out;
}

export const interpretSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ query: z.string().trim().min(2).max(300) }).parse(d))
  .handler(async ({ data }): Promise<Interpretation> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI_CONFIG");
    const raw = await callModel(data.query, apiKey);
    let parsed: { status: string; message: string; filters: Array<Record<string, unknown>> };
    try { parsed = JSON.parse(raw); } catch { throw new Error("AI_DOWN"); }
    if (parsed.status !== "search") {
      return { status: parsed.status === "unsupported" ? "unsupported" : "clarify", message: String(parsed.message || "").slice(0, 400) };
    }
    const cleaned = (parsed.filters ?? []).map((f) => {
      const o: Record<string, unknown> = { field: f["field"], operator: f["operator"], value: f["value"] };
      if (f["field"] === "visit_date" || f["field"] === "last_visit_date") o["value_to"] = f["value_to"];
      if (f["field"] === "reference_id") o["value"] = normalizeRef(String(f["value"] ?? ""));
      return o;
    });
    const v = filtersSchema.safeParse(cleaned);
    if (!v.success) return { status: "clarify", message: "" };
    return { status: "search", filters: v.data };
  });

const PAGE = 20;
const VISIT_CAP = 500;

export type AiResultRow = { id: string; reference_id: string; full_name: string; phone: string | null; last_visit: string | null };

/** Runs the validated filters with the caller's own Supabase session, so RLS limits results to their clinic. */
export const runFilteredSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ filters: filtersSchema, page: z.number().int().min(0).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    let idRestrict: string[] | null = null;
    let truncated = false;

    for (const f of data.filters) {
      if (f.field !== "visit_date" && f.field !== "last_visit_date") continue;
      const { data: vs, error } = await sb.from("visits").select("patient_id").gte("visit_date", f.value).lte("visit_date", f.value_to).limit(5000);
      if (error) throw new Error("DB");
      let ids = [...new Set((vs ?? []).map((r) => r.patient_id))];
      if (f.field === "last_visit_date" && ids.length) {
        const later = new Set<string>();
        for (let i = 0; i < ids.length; i += 200) {
          const { data: lv, error: e2 } = await sb.from("visits").select("patient_id").in("patient_id", ids.slice(i, i + 200)).gt("visit_date", f.value_to).limit(5000);
          if (e2) throw new Error("DB");
          lv?.forEach((r) => later.add(r.patient_id));
        }
        ids = ids.filter((id) => !later.has(id));
      }
      idRestrict = idRestrict === null ? ids : idRestrict.filter((id) => ids.includes(id));
    }
    if (idRestrict && idRestrict.length > VISIT_CAP) { idRestrict = idRestrict.slice(0, VISIT_CAP); truncated = true; }
    if (idRestrict && idRestrict.length === 0) return { rows: [] as AiResultRow[], total: 0, pageSize: PAGE, truncated };

    let q = sb.from("patients").select("id,reference_id,full_name,phone", { count: "exact" });
    for (const f of data.filters) {
      if (f.field === "full_name") {
        const p = f.operator === "equals" ? f.value.replace(/[%_\\]/g, "").replace(/\s+/g, " ").trim() : likePattern(f.value);
        if (!p) return { rows: [], total: 0, pageSize: PAGE, truncated };
        q = q.ilike("full_name", p);
      } else if (f.field === "reference_id") q = q.eq("reference_id", normalizeRef(f.value));
      else if (f.field === "phone") { const p = likePattern(f.value); if (p) q = q.ilike("phone", p); }
    }
    if (idRestrict) q = q.in("id", idRestrict);
    const from = data.page * PAGE;
    const { data: ps, count, error } = await q.order("full_name").range(from, from + PAGE - 1);
    if (error) throw new Error("DB");

    const last = new Map<string, string>();
    if (ps?.length) {
      const { data: vs } = await sb.from("visits").select("patient_id,visit_date").in("patient_id", ps.map((p) => p.id)).order("visit_date", { ascending: false }).limit(2000);
      vs?.forEach((v) => { if (!last.has(v.patient_id)) last.set(v.patient_id, v.visit_date); });
    }
    const rows: AiResultRow[] = (ps ?? []).map((p) => ({ ...p, last_visit: last.get(p.id) ?? null }));
    return { rows, total: count ?? rows.length, pageSize: PAGE, truncated };
  });
