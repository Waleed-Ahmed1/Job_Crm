import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <Card className="flex min-h-52 flex-col items-center justify-center gap-3 border-dashed p-8 text-center"><div className="rounded-xl bg-muted p-3"><Icon className="size-5 text-muted-foreground" /></div><div><h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p></div></Card>;
}
