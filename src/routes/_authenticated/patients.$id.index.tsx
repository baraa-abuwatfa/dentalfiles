import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingRows } from "@/components/States";
import { createVisit, formatDate, friendlyError, patientQuery, visitsQuery } from "@/lib/patients";

export const Route = createFileRoute("/_authenticated/patients/$id/")({
  head: () => ({ meta: [{ title: "Patient profile — DentalFile AI" }, { name: "description", content: "Patient details and dental visit history." }, { property: "og:title", content: "Patient profile — DentalFile AI" }, { property: "og:description", content: "Patient details and dental visit history." }] }),
  component: Profile,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{children}</dd></div>;
}

function Profile() {
  const { id } = Route.useParams();
  const { data: p, isLoading, error } = useQuery(patientQuery(id));
  if (isLoading) return <LoadingRows />;
  if (error) return <ErrorState error={error} />;
  if (!p) return <EmptyState title="Patient not found"><Link to="/patients" className="text-sm text-primary">Back to patients</Link></EmptyState>;
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-lg bg-secondary px-2 py-1 font-mono text-xs">{p.reference_id}</span>
          <h1 className="mt-2 text-3xl font-bold">{p.full_name}</h1>
        </div>
        <Button asChild variant="outline"><Link to="/patients/$id/edit" params={{ id }}><Pencil />Edit</Link></Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <dl className="grid content-start gap-4 rounded-2xl border bg-card p-6 shadow-soft">
          <Field label="Date of birth">{formatDate(p.date_of_birth)}</Field>
          <Field label="Phone">{p.phone ?? "—"}</Field>
          <Field label="Allergies">{p.allergies ? <span className="font-medium text-destructive">{p.allergies}</span> : "None recorded"}</Field>
          <Field label="X-ray">
            {p.xray_url ? <a href={p.xray_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">Open X-ray<ExternalLink className="h-3.5 w-3.5" /></a> : "—"}
          </Field>
          <Field label="Medical notes">{p.medical_notes ?? "—"}</Field>
        </dl>
        <div className="grid content-start gap-6 lg:col-span-2">
          <VisitForm patientId={id} />
          <Visits patientId={id} />
        </div>
      </div>
    </div>
  );
}

function Visits({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useQuery(visitsQuery(patientId));
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-soft">
      <h2 className="mb-4 font-semibold">Visit history</h2>
      {isLoading ? <LoadingRows n={2} /> : error ? <ErrorState error={error} /> : data!.length === 0 ? <EmptyState title="No visits recorded yet" /> : (
        <ol className="grid gap-4 border-l-2 border-secondary pl-5">
          {data!.map((v) => (
            <li key={v.id} className="relative">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-primary" />
              <p className="text-sm text-muted-foreground">{formatDate(v.visit_date)}</p>
              <p className="font-medium">{v.treatment}</p>
              {v.dentist_notes && <p className="mt-1 whitespace-pre-wrap text-sm">{v.dentist_notes}</p>}
              {v.next_visit_date && <p className="mt-1 text-sm text-primary">Next visit: {formatDate(v.next_visit_date)}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function VisitForm({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const empty = { visit_date: today, treatment: "", dentist_notes: "", next_visit_date: "" };
  const [v, setV] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!v.visit_date || !v.treatment.trim()) return setErr("Visit date and treatment are required.");
    if (v.next_visit_date && v.next_visit_date < v.visit_date) return setErr("Next visit must be after the visit date.");
    setErr(""); setBusy(true);
    try {
      await createVisit(patientId, { visit_date: v.visit_date, treatment: v.treatment.trim(), dentist_notes: v.dentist_notes.trim() || null, next_visit_date: v.next_visit_date || null });
      await qc.invalidateQueries({ queryKey: ["visits", patientId] });
      setV(empty); toast.success("Visit added");
    } catch (e) { toast.error(friendlyError(e)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft sm:grid-cols-2">
      <h2 className="font-semibold sm:col-span-2">Add visit</h2>
      <div className="grid gap-2"><Label htmlFor="vd">Visit date *</Label><Input id="vd" type="date" value={v.visit_date} onChange={(e) => setV({ ...v, visit_date: e.target.value })} /></div>
      <div className="grid gap-2"><Label htmlFor="nv">Next visit</Label><Input id="nv" type="date" value={v.next_visit_date} onChange={(e) => setV({ ...v, next_visit_date: e.target.value })} /></div>
      <div className="grid gap-2 sm:col-span-2"><Label htmlFor="tr">Treatment *</Label><Input id="tr" value={v.treatment} onChange={(e) => setV({ ...v, treatment: e.target.value })} /></div>
      <div className="grid gap-2 sm:col-span-2"><Label htmlFor="dn">Dentist's notes</Label><Textarea id="dn" rows={3} value={v.dentist_notes} onChange={(e) => setV({ ...v, dentist_notes: e.target.value })} /></div>
      {err && <p className="text-sm text-destructive sm:col-span-2">{err}</p>}
      <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Save visit</Button></div>
    </form>
  );
}
