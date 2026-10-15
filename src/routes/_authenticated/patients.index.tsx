import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientSearch } from "@/components/PatientSearch";
import { EmptyState, ErrorState, LoadingRows } from "@/components/States";
import { formatDate, patientsQuery } from "@/lib/patients";

export const Route = createFileRoute("/_authenticated/patients/")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s['q'] === "string" && s['q'] ? s['q'] : undefined }),
  head: () => ({ meta: [{ title: "Patients — DentalFile AI" }, { name: "description", content: "Search and browse patient records." }, { property: "og:title", content: "Patients — DentalFile AI" }, { property: "og:description", content: "Search and browse patient records." }] }),
  component: PatientsPage,
});

function PatientsPage() {
  const { q = "" } = Route.useSearch();
  const { data, isLoading, error } = useQuery(patientsQuery(q));
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Patients</h1><p className="text-muted-foreground">{q ? `Results for “${q}”` : "All patient records"}</p></div>
        <Button asChild><Link to="/patients/new"><Plus />Add patient</Link></Button>
      </div>
      <PatientSearch key={q} initial={q} />
      {isLoading ? <LoadingRows /> : error ? <ErrorState error={error} /> : data!.length === 0 ? (
        <EmptyState title={q ? "No matching patients" : "No patients yet"} />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr><th className="p-3">ID</th><th className="p-3">Name</th><th className="hidden p-3 sm:table-cell">Date of birth</th><th className="hidden p-3 md:table-cell">Phone</th></tr>
            </thead>
            <tbody className="divide-y">
              {data!.map((p) => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs"><Link to="/patients/$id" params={{ id: p.id }}>{p.reference_id}</Link></td>
                  <td className="p-3 font-medium"><Link to="/patients/$id" params={{ id: p.id }} className="hover:text-primary">{p.full_name}</Link></td>
                  <td className="hidden p-3 sm:table-cell">{formatDate(p.date_of_birth)}</td>
                  <td className="hidden p-3 md:table-cell">{p.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
