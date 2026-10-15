import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import molar from "@/assets/molar.png";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//") ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign in — DentalFile AI" }, { name: "description", content: "Staff sign-in for DentalFile AI patient records." }, { property: "og:title", content: "Sign in — DentalFile AI" }, { property: "og:description", content: "Staff sign-in for DentalFile AI patient records." }] }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setError(/invalid/i.test(error.message) ? "Incorrect email or password." : error.message);
    navigate({ to: redirect ?? "/dashboard", replace: true });
  }

  return (
    <div className="bg-hero grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">
        <img src={molar} alt="" width={1024} height={1024} className="animate-float mx-auto w-28" />
        <h1 className="mt-2 text-center text-2xl font-bold">DentalFile <span className="text-primary">AI</span></h1>
        <p className="text-center text-sm text-muted-foreground">Staff sign-in</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
          <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Sign in</Button>
        </form>
      </div>
    </div>
  );
}
