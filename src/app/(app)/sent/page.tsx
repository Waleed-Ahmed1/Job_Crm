import Link from "next/link";
import { Check, MailCheck, MailPlus } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listSentMail } from "@/lib/data";
import { formatDateTime } from "@/lib/time";
import type { SentMailItem } from "@/lib/types";

export default async function SentTrackerPage() {
  const items = await listSentMail();
  return (
    <div className="space-y-7">
      <PageHeader
        title="Sent tracker"
        description="Every email you send from Northstar, and whether it was opened or answered. Updates automatically."
        actions={<Button asChild><Link href="/email/compose"><MailPlus />Compose</Link></Button>}
      />
      <AutoRefresh seconds={30} />
      {items.length === 0 ? (
        <EmptyState icon={MailCheck} title="No sent mail yet" description="Emails you send from Compose will appear here with their sent, read, and replied status." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Recipient</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Sent at</th>
                  <th className="px-5 py-3 text-center font-medium">Sent</th>
                  <th className="px-5 py-3 text-center font-medium">Read</th>
                  <th className="px-5 py-3 text-center font-medium">Replied</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/35">
                    <td className="max-w-56 truncate px-5 py-4 font-medium">{item.recipients.join(", ") || "Unknown"}</td>
                    <td className="max-w-72 truncate px-5 py-4">{item.subject}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{item.sentAt ? formatDateTime(item.sentAt) : "—"}</td>
                    <td className="px-5 py-4"><div className="flex justify-center"><SentCell item={item} /></div></td>
                    <td className="px-5 py-4"><div className="flex justify-center"><ReadCell item={item} /></div></td>
                    <td className="px-5 py-4"><div className="flex justify-center"><Tick on={Boolean(item.repliedAt)} title={item.repliedAt ? `Replied ${formatDateTime(item.repliedAt)}` : "No reply yet"} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
        “Read” means the recipient’s mail app loaded the message’s tracking image. It stays empty if they block images or read in plain text, and Apple Mail may
        mark mail as read before it is opened. “Replied” is detected from synchronized Gmail threads and is the more reliable signal.
      </p>
    </div>
  );
}

function Tick({ on, title }: { on: boolean; title?: string }) {
  return (
    <span title={title} className={on ? "grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700" : "grid size-6 place-items-center rounded-full border border-dashed border-border"}>
      {on ? <Check className="size-3.5" aria-label="Yes" /> : <span className="sr-only">No</span>}
    </span>
  );
}

function SentCell({ item }: { item: SentMailItem }) {
  if (item.status === "sent") return <Tick on title="Sent" />;
  if (item.status === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (item.status === "uncertain") return <Badge variant="outline" title="Delivery could not be confirmed">Uncertain</Badge>;
  return <Badge variant="secondary">Sending</Badge>;
}

function ReadCell({ item }: { item: SentMailItem }) {
  if (!item.tracked) return <span className="text-xs text-muted-foreground" title="Sent without a tracking image (no public HTTPS address was configured).">Not tracked</span>;
  return <Tick on={Boolean(item.firstOpenedAt)} title={item.firstOpenedAt ? `First opened ${formatDateTime(item.firstOpenedAt)}` : "Not opened yet"} />;
}