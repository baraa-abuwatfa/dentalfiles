import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — DentalFile AI" }, { name: "description", content: "Account and clinic settings." }, { property: "og:title", content: "Settings — DentalFile AI" }, { property: "og:description", content: "Account and clinic settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const { data: clinics } = useQuery({
    queryKey: ["clinics"],
    queryFn: async () => { const { data, error } = await supabase.from("clinics").select("id,name"); if (error) throw error; return data; },
  });
  return (
    <div className="grid max-w-2xl gap-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="grid gap-3 rounded-2xl border bg-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Signed in as</p><p className="font-medium">{user.email}</p>
        <p className="mt-2 text-sm text-muted-foreground">Clinic</p>
        <p className="font-medium">{clinics === undefined ? "…" : clinics.length ? clinics.map((c) => c.name).join(", ") : "Not linked to a clinic — ask your administrator."}</p>
      </div>
    </div>
  );
}
