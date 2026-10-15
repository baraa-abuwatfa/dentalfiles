import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidUrl, type Patient, type PatientInput } from "@/lib/patients";

export function PatientForm({
  initial, submitLabel, onSubmit,
}: { initial?: Patient | null; submitLabel: string; onSubmit: (v: PatientInput) => Promise<void> }) {
  const [v, setV] = useState({
    full_name: initial?.full_name ?? "",
    date_of_birth: initial?.date_of_birth ?? "",
    phone: initial?.phone ?? "",
    allergies: initial?.allergies ?? "",
    medical_notes: initial?.medical_notes ?? "",
    xray_url: initial?.xray_url ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (!v.full_name.trim()) errs['full_name'] = "Full name is required.";
    if (v.date_of_birth && v.date_of_birth > new Date().toISOString().slice(0, 10)) errs['date_of_birth'] = "Date of birth can't be in the future.";
    if (v.xray_url.trim() && !isValidUrl(v.xray_url.trim())) errs['xray_url'] = "Enter a valid link starting with http:// or https://";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const n = (s: string) => (s.trim() ? s.trim() : null);
      await onSubmit({
        full_name: v.full_name.trim(), date_of_birth: n(v.date_of_birth), phone: n(v.phone),
        allergies: n(v.allergies), medical_notes: n(v.medical_notes), xray_url: n(v.xray_url),
      });
    } finally { setBusy(false); }
  }

  const err = (k: string) => errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>;
  return (
    <form onSubmit={submit} className="grid gap-5 rounded-2xl border bg-card p-6 shadow-soft sm:grid-cols-2">
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input id="full_name" value={v.full_name} onChange={set("full_name")} />{err("full_name")}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dob">Date of birth</Label>
        <Input id="dob" type="date" value={v.date_of_birth} onChange={set("date_of_birth")} />{err("date_of_birth")}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" value={v.phone} onChange={set("phone")} />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="allergies">Known allergies</Label>
        <Input id="allergies" value={v.allergies} onChange={set("allergies")} placeholder="e.g. Penicillin, latex" />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="notes">Medical notes</Label>
        <Textarea id="notes" rows={4} value={v.medical_notes} onChange={set("medical_notes")} />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="xray">X-ray link (optional)</Label>
        <Input id="xray" value={v.xray_url} onChange={set("xray_url")} placeholder="https://…" />{err("xray_url")}
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{submitLabel}</Button>
      </div>
    </form>
  );
}
