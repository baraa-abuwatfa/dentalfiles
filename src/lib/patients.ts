import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Patient = {
  id: string;
  reference_id: string;
  full_name: string;
  date_of_birth: string | null;
  phone: string | null;
  allergies: string | null;
  medical_notes: string | null;
  xray_url: string | null;
  created_at: string;
  updated_at: string;
};
export type Visit = {
  id: string;
  patient_id: string;
  visit_date: string;
  treatment: string;
  dentist_notes: string | null;
  next_visit_date: string | null;
  created_at: string;
};
export type PatientInput = Omit<Patient, "id" | "reference_id" | "created_at" | "updated_at">;
export type VisitInput = Omit<Visit, "id" | "created_at" | "patient_id">;

const COLS = "id,reference_id,full_name,date_of_birth,phone,allergies,medical_notes,xray_url,created_at,updated_at";

export const statsQuery = () =>
  queryOptions({
    queryKey: ["patients", "stats"],
    queryFn: async () => {
      const [count, recent] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("patients").select(COLS).order("created_at", { ascending: false }).limit(5),
      ]);
      if (count.error) throw count.error;
      if (recent.error) throw recent.error;
      return { total: count.count ?? 0, recent: (recent.data ?? []) as Patient[] };
    },
  });

export const patientsQuery = (search: string) =>
  queryOptions({
    queryKey: ["patients", "list", search],
    queryFn: async () => {
      let q = supabase.from("patients").select(COLS).order("created_at", { ascending: false }).limit(200);
      const s = search.trim();
      if (s) {
        const safe = s.replace(/[,%()*\\]/g, " ");
        q = /^p-\d+$/i.test(s)
          ? q.eq("reference_id", s.toUpperCase())
          : q.or(`full_name.ilike.%${safe}%,reference_id.ilike.${safe}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Patient[];
    },
  });

export const patientQuery = (id: string) =>
  queryOptions({
    queryKey: ["patients", "one", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select(COLS).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Patient | null;
    },
  });

export const visitsQuery = (patientId: string) =>
  queryOptions({
    queryKey: ["visits", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("id,patient_id,visit_date,treatment,dentist_notes,next_visit_date,created_at")
        .eq("patient_id", patientId)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Visit[];
    },
  });

export async function createPatient(input: PatientInput) {
  const { data, error } = await supabase.from("patients").insert(input).select(COLS).single();
  if (error) throw error;
  return data as Patient;
}
export async function updatePatient(id: string, input: PatientInput) {
  const { data, error } = await supabase.from("patients").update(input).eq("id", id).select(COLS).single();
  if (error) throw error;
  return data as Patient;
}
export async function createVisit(patientId: string, input: VisitInput) {
  const { error } = await supabase.from("visits").insert({ ...input, patient_id: patientId });
  if (error) throw error;
}

export function friendlyError(e: unknown) {
  const m = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  if (/row-level security|null value in column "clinic_id"/i.test(m))
    return "Your account isn't linked to a clinic yet. Ask the clinic administrator for access.";
  if (/fetch/i.test(m)) return "Network problem — please check your connection and try again.";
  return m;
}

export function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}
export function isValidUrl(u: string) {
  try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:"; } catch { return false; }
}
