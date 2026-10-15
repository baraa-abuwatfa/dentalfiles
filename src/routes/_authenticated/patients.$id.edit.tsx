import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PatientForm } from "@/components/PatientForm";
import { EmptyState, ErrorState, LoadingRows } from "@/components/States";
import { friendlyError, patientQuery, updatePatient } from "@/lib/patients";

export const Route = createFileRoute("/_authenticated/patients/$id/edit")({
  head: () => ({ meta: [{ title: "Edit patient — DentalFile AI" }, { name: "description", content: "Update a patient record." }, { property: "og:title", content: "Edit patient — DentalFile AI" }, { property: "og:description", content: "Update a patient record." }] }),
  component: EditPatient,
});

function EditPatient() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(patientQuery(id));
  if (isLoading) return <LoadingRows />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState title="Patient not found" />;
  return (
    <div className="grid max-w-3xl gap-6">
      <h1 className="text-3xl font-bold">Edit {data.full_name} <span className="font-mono text-base text-muted-foreground">{data.reference_id}</span></h1>
      <PatientForm initial={data} submitLabel="Save changes" onSubmit={async (v) => {
        try {
          await updatePatient(id, v);
          await qc.invalidateQueries({ queryKey: ["patients"] });
          toast.success("Changes saved");
          navigate({ to: "/patients/$id", params: { id } });
        } catch (e) { toast.error(friendlyError(e)); }
      }} />
    </div>
  );
}
