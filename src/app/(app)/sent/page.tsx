import Link from "next/link";
import { MailCheck, MailPlus } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { CheckRepliesButton } from "@/components/check-replies-button";
import { DeleteTrackerButton } from "@/components/delete-tracker-button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listSentMail, type TrackerFilter } from "@/lib/data";
import { getEmailPreferences, WORKSPACE_SETUP_MESSAGE } from "@/lib/email/preferences";
import { formatDateTime } from "@/lib/time";
import type { SentMailItem } from "@/lib/types";
const filters = ["all", "unopened", "opened", "replied", "failed"] as const;
export default async function SentTrackerPage({ searchParams }: { searchParams: Promise<{ filter?: string; page?: string }> }) {
  const params = await searchParams;
  const filter: TrackerFilter = filters.includes(params.filter as TrackerFilter) ? params.filter as TrackerFilter : "all";
  const requestedPage = Number(params.page ?? 0);
  const page = Number.isInteger(requestedPage) && requestedPage >= 0 && requestedPage <= 10000 ? requestedPage : 0;
  const [rows, preferences] = await Promise.all([listSentMail({ filter, page }), getEmailPreferences()]);
  const items = rows.slice(0, 50);
  const hasNext = rows.length > 50;
  return <div className="space-y-7"><PageHeader title="Email tracker" description="Review delivery, open signals, and replies." actions={<><CheckRepliesButton /><Button asChild><Link href="/email/compose"><MailPlus />Compose</Link></Button></>} />
    <AutoRefresh seconds={60} />
    {preferences.setupRequired ? <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm">{WORKSPACE_SETUP_MESSAGE}</p> : null}
    <nav aria-label="Tracker filters" className="flex flex-wrap gap-2">{filters.map((value) => <Button key={value} variant={filter === value ? "default" : "outline"} size="sm" asChild><Link href={{ pathname: "/sent", query: { filter: value } }}>{({ all: "All", unopened: "No open signal", opened: "Opened", replied: "Replied", failed: "Failed" })[value]}</Link></Button>)}</nav>
    {items.length === 0 ? <EmptyState icon={MailCheck} title={filter === "all" && page === 0 ? "No tracked emails yet" : "No matching emails"} description="Emails sent from Compose appear here. Removed trackers stay out of this list." /> : <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Sent at</th><th className="px-4 py-3">Delivery</th><th className="px-4 py-3">Open signal</th><th className="px-4 py-3">Reply</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id} className="hover:bg-muted/35"><td className="max-w-56 truncate px-4 py-4" title={item.recipients.join(", ")}>{item.recipients.join(", ") || "Unknown"}</td><td className="max-w-72 truncate px-4 py-4 font-medium" title={item.subject}>{item.subject}</td><td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{item.sentAt ? formatDateTime(item.sentAt) : "Pending"}</td><td className="px-4 py-4"><Badge variant={item.status === "failed" ? "destructive" : item.status === "sent" ? "default" : "outline"}>{({ sent: "Sent", failed: "Failed", uncertain: "Uncertain", sending: "Sending", pending: "Pending" })[item.status]}</Badge></td><td className="px-4 py-4"><OpenStatus item={item} /></td><td className="px-4 py-4"><Badge variant={item.repliedAt ? "default" : "outline"} title={item.repliedAt ? formatDateTime(item.repliedAt) : undefined}>{item.repliedAt ? "Replied" : "No reply"}</Badge></td><td className="px-4 py-4"><DeleteTrackerButton id={item.id} disabled={preferences.setupRequired || !["sent", "failed"].includes(item.status)} /></td></tr>)}</tbody></table></div></Card>}
    <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Page {page + 1} · Up to 50 emails per page · Refreshes every minute</p><div className="flex gap-2">{page > 0 ? <Button variant="outline" size="sm" asChild><Link href={{ pathname: "/sent", query: { filter, page: page - 1 } }}>Previous</Link></Button> : null}{hasNext ? <Button variant="outline" size="sm" asChild><Link href={{ pathname: "/sent", query: { filter, page: page + 1 } }}>Next</Link></Button> : null}</div></div>
    <p className="max-w-3xl text-xs leading-5 text-muted-foreground">An open signal means the tracking image loaded. Image blocking can hide reads, and automatic image loading can register opens. Replies are detected from Gmail conversations. Deleting a tracker stops recording opens; the Gmail email and dashboard totals remain.</p>
  </div>;
}
function OpenStatus({ item }: { item: SentMailItem }) {
  if (item.status !== "sent") return <span className="text-xs text-muted-foreground">Awaiting delivery</span>;
  if (!item.tracked) return <span className="text-xs text-muted-foreground">Not tracked</span>;
  return <Badge variant={item.firstOpenedAt ? "default" : "outline"} title={item.firstOpenedAt ? `First signal: ${formatDateTime(item.firstOpenedAt)} · ${item.openCount} image loads` : "No image load detected"}>{item.firstOpenedAt ? "Opened" : "No signal"}</Badge>;
}
