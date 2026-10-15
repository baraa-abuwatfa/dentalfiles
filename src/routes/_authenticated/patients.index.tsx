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
  const { data, isLoading, isFetching, error } = useQuery(patientsQuery(q));
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Patients</h1><p className="text-muted-foreground">{q ? `Results for “${q}”` : "All patient records"}</p></div>
        <Button asChild><Link to="/patients/new"><Plus />Add patient</Link></Button>
      </div>
      <PatientSearch initial={q} live />
      {isFetching && !isLoading && <p className="-mt-3 text-sm text-muted-foreground" aria-live="polite">Searching…</p>}
      {isLoading ? <LoadingRows /> : error ? <ErrorState error={error} /> : data!.length === 0 ? (
        <EmptyState title={q ? `No patients found for “${q}”` : "No patients yet"}>{q && <p className="text-sm text-muted-foreground">Check the spelling, or search by patient ID such as P-1025.</p>}</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Phone</th><th className="hidden p-3 md:table-cell">Date of birth</th></tr>
            </thead>
            <tbody className="divide-y">
              {data!.map((p) => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs"><Link to="/patients/$id" params={{ id: p.id }}>{p.reference_id}</Link></td>
                  <td className="p-3 font-medium"><Link to="/patients/$id" params={{ id: p.id }} className="hover:text-primary">{p.full_name}</Link></td>
                  <td className="p-3">{p.phone ?? "—"}</td>
                  <td className="hidden p-3 md:table-cell">{formatDate(p.date_of_birth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
