import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { normalizeSearch } from "@/lib/patients";

/**
 * On the dashboard (live=false) the search runs on submit.
 * On the patients page (live=true) results update as you type, debounced.
 */
export function PatientSearch({ initial = "", large = false, live = false }: { initial?: string; large?: boolean; live?: boolean }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  const last = useRef(normalizeSearch(initial));

  const go = (value: string, replace: boolean) => {
    const n = normalizeSearch(value);
    if (n === last.current && replace) return;
    last.current = n;
    navigate({ to: "/patients", search: { q: n || undefined }, replace });
  };

  useEffect(() => {
    if (!live) return;
    const t = setTimeout(() => go(q, true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, live]);

  return (
    <form className="flex w-full gap-2" role="search" onSubmit={(e) => { e.preventDefault(); go(q, live); }}>
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
