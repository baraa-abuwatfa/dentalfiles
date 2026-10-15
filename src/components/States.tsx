import { AlertCircle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { friendlyError } from "@/lib/patients";

export function LoadingRows({ n = 4 }: { n?: number }) {
  return <div className="grid gap-3">{Array.from({ length: n }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
}
export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card p-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {children}
    </div>
  );
}
export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p>{friendlyError(error)}</p>
    </div>
  );
}
