import { Badge } from "@/components/ui/badge";
import type { ApplicationStage } from "@/lib/types";
const styles: Record<ApplicationStage, string> = { Saved: "bg-slate-100 text-slate-700", Applied: "bg-blue-100 text-blue-700", Screening: "bg-violet-100 text-violet-700", Interview: "bg-amber-100 text-amber-800", Offer: "bg-emerald-100 text-emerald-700", Rejected: "bg-rose-100 text-rose-700", Withdrawn: "bg-zinc-100 text-zinc-600" };
export function StageBadge({ stage }: { stage: ApplicationStage }) { return <Badge className={styles[stage]}>{stage}</Badge>; }
