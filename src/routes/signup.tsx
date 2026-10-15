import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import molar from "@/assets/molar.png";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — DentalFile AI" }, { name: "description", content: "Create a new DentalFile AI account." }, { property: "og:title", content: "Create account — DentalFile AI" }, { property: "og:description", content: "Create a new DentalFile AI account." }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [v, setV] = useState({ name: "", email: "", pw: "", pw2: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (!v.name.trim()) errs["name"] = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errs["email"] = "Enter a valid email address.";
    if (v.pw.length < 8) errs["pw"] = "Password must be at least 8 characters.";
    if (v.pw !== v.pw2) errs["pw2"] = "Passwords don't match.";
    setErrors(errs); setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: v.email.trim(), password: v.pw,
      options: { data: { full_name: v.name.trim() }, emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setBusy(false);
    if (error) {
      const m = error.message;
      return setFormError(/already registered|already exists/i.test(m) ? "An account with this email already exists. Try logging in instead."
        : /password/i.test(m) ? m : /rate limit/i.test(m) ? "Too many attempts — please wait a few minutes and try again." : m);
    }
    // When email confirmation is on, an existing email returns a user with no identities.
    if (data.user && data.user.identities?.length === 0) return setFormError("An account with this email already exists. Try logging in instead.");
    if (data.session) return navigate({ to: "/dashboard", replace: true });
    setSentTo(v.email.trim());
  }

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  const err = (k: string) => errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>;

  return (
    <div className="bg-hero grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">
        <img src={molar} alt="" width={1024} height={1024} className="animate-float mx-auto w-28" />
        <h1 className="mt-2 text-center text-2xl font-bold">DentalFile <span className="text-primary">AI</span></h1>
        <p className="text-center text-sm text-muted-foreground">Create a new account</p>
        {sentTo ? (
          <div className="mt-6 grid gap-3 rounded-2xl border bg-card p-6 text-center shadow-soft">
            <MailCheck className="mx-auto h-8 w-8 text-primary" />
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">We sent a confirmation link to <b>{sentTo}</b>. Please verify your email before logging in.</p>
            <Link to="/auth" className="text-sm font-medium text-primary hover:underline">Back to log in</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 grid gap-4 rounded-2xl border bg-card p-6 shadow-soft">
            <div className="grid gap-2"><Label htmlFor="name">Full name</Label><Input id="name" autoComplete="name" value={v.name} onChange={set("name")} />{err("name")}</div>
            <div className="grid gap-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" value={v.email} onChange={set("email")} />{err("email")}</div>
            <div className="grid gap-2"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete="new-password" value={v.pw} onChange={set("pw")} />{err("pw")}</div>
            <div className="grid gap-2"><Label htmlFor="pw2">Confirm password</Label><Input id="pw2" type="password" autoComplete="new-password" value={v.pw2} onChange={set("pw2")} />{err("pw2")}</div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Create account</Button>
            <p className="text-center text-sm text-muted-foreground">Already have an account? <Link to="/auth" className="font-medium text-primary hover:underline">Log in</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
