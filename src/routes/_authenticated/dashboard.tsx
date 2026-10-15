import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientSearch } from "@/components/PatientSearch";
import { EmptyState, ErrorState, LoadingRows } from "@/components/States";
import { formatDate, statsQuery } from "@/lib/patients";
import molar from "@/assets/molar.png";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DentalFile AI" }, { name: "description", content: "Clinic overview and patient search." }, { property: "og:title", content: "Dashboard — DentalFile AI" }, { property: "og:description", content: "Clinic overview and patient search." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, error } = useQuery(statsQuery());
  return (
    <div className="grid gap-6">
      <section className="bg-hero relative overflow-hidden rounded-3xl border p-6 shadow-soft sm:p-10">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Patient records</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Find a patient file or start a new one.</p>
          <div className="mt-6"><PatientSearch large /></div>
          <Button asChild className="mt-4" variant="secondary"><Link to="/patients/new"><Plus />Add patient</Link></Button>
        </div>
        <div className="pointer-events-none absolute -right-10 top-1/2 hidden w-80 -translate-y-1/2 md:block">
          <div className="animate-glow absolute inset-10 rounded-full bg-sky shadow-[var(--shadow-glow)]" />
          <img src={molar} alt="" width={1024} height={1024} className="animate-float relative" />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-3 text-muted-foreground"><Users className="h-5 w-5 text-primary" />Total patients</div>
          <p className="mt-3 font-display text-4xl font-bold">{isLoading ? "…" : error ? "—" : data!.total}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-soft md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recently added</h2>
            <Link to="/patients" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {isLoading ? <LoadingRows n={3} /> : error ? <ErrorState error={error} /> : data!.recent.length === 0 ? (
            <EmptyState title="No patients yet"><Link to="/patients/new" className="text-sm text-primary hover:underline">Add the first patient</Link></EmptyState>
          ) : (
            <ul className="divide-y">
              {data!.recent.map((p) => (
                <li key={p.id}>
                  <Link to="/patients/$id" params={{ id: p.id }} className="flex items-center gap-3 py-3 hover:text-primary">
                    <span className="rounded-lg bg-secondary px-2 py-1 font-mono text-xs">{p.reference_id}</span>
                    <span className="flex-1 truncate font-medium">{p.full_name}</span>
                    <span className="hidden text-sm text-muted-foreground sm:inline">{formatDate(p.created_at)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
