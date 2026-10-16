import { z } from "zod";

/** Allowlist: only real columns on public.patients / public.visits, with the operators each supports. */
export const ALLOWED = {
  full_name: ["contains", "equals"],
  reference_id: ["equals"],
  phone: ["contains"],
  visit_date: ["between"],
  last_visit_date: ["between"],
} as const;

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(s)), "invalid date");

export const filterSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("full_name"), operator: z.enum(["contains", "equals"]), value: z.string().trim().min(1).max(100) }),
  z.object({ field: z.literal("reference_id"), operator: z.literal("equals"), value: z.string().trim().min(1).max(30) }),
  z.object({ field: z.literal("phone"), operator: z.literal("contains"), value: z.string().trim().regex(/^[0-9+\-\s()]{3,25}$/) }),
  z.object({ field: z.literal("visit_date"), operator: z.literal("between"), value: date, value_to: date }),
  z.object({ field: z.literal("last_visit_date"), operator: z.literal("between"), value: date, value_to: date }),
]);
export type SearchFilter = z.infer<typeof filterSchema>;

export const filtersSchema = z.array(filterSchema).min(1).max(5).superRefine((fs, ctx) => {
  for (const f of fs) if ("value_to" in f && f.value_to < f.value) ctx.addIssue({ code: "custom", message: "date range reversed" });
});

/** Normalise a patient reference like "p 1025" / "P1025" to the stored format "P-1025". Other formats pass through uppercased. */
export function normalizeRef(v: string) {
  const s = v.replace(/\s+/g, "").toUpperCase();
  const m = s.match(/^P-?(\d+)$/);
  return m ? `P-${m[1]}` : s;
}

/** Strip LIKE/PostgREST special characters and turn spaces into wildcards. */
export function likePattern(v: string) {
  const words = v.replace(/[%_\\,()*"]/g, " ").split(/\s+/).filter(Boolean);
  return words.length ? `%${words.join("%")}%` : null;
}
