import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PatientSearch({ initial = "", large = false }: { initial?: string; large?: boolean }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  return (
    <form
      className="flex w-full gap-2"
      onSubmit={(e) => { e.preventDefault(); navigate({ to: "/patients", search: { q: q.trim() || undefined } }); }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search patients"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or patient ID (e.g. P-1025)"
          className={large ? "h-12 rounded-xl bg-card pl-10 text-base shadow-soft" : "h-10 bg-card pl-10"}
        />
      </div>
      <Button type="submit" size={large ? "lg" : "default"} className={large ? "h-12 rounded-xl" : ""}>Search</Button>
    </form>
  );
}
