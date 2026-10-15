import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PatientForm } from "@/components/PatientForm";
import { createPatient, friendlyError } from "@/lib/patients";

export const Route = createFileRoute("/_authenticated/patients/new")({
  head: () => ({ meta: [{ title: "Add patient — DentalFile AI" }, { name: "description", content: "Create a new patient record." }, { property: "og:title", content: "Add patient — DentalFile AI" }, { property: "og:description", content: "Create a new patient record." }] }),
  component: NewPatient,
});

function NewPatient() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <div className="grid max-w-3xl gap-6">
      <h1 className="text-3xl font-bold">Add patient</h1>
      <PatientForm submitLabel="Save patient" onSubmit={async (v) => {
        try {
          const p = await createPatient(v);
          await qc.invalidateQueries({ queryKey: ["patients"] });
          toast.success(`Patient saved as ${p.reference_id}`);
          navigate({ to: "/patients/$id", params: { id: p.id } });
        } catch (e) { toast.error(friendlyError(e)); }
      }} />
    </div>
  );
}
