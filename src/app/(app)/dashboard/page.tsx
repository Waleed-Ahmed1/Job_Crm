import Link from "next/link";
import { MailPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIntegrationStatus } from "@/lib/data";
import { getEmailMetrics } from "@/lib/email/metrics";
import { getEmailPreferences, WORKSPACE_SETUP_MESSAGE } from "@/lib/email/preferences";
import { formatDateTime } from "@/lib/time";
export default async function DashboardPage() {
  const [metrics, preferences, integration] = await Promise.all([getEmailMetrics(), getEmailPreferences(), getIntegrationStatus()]);
  return <div className="space-y-7">
    <PageHeader title="Email dashboard" description="Your outreach, responses, and sending targets." actions={<Button asChild><Link href="/email/compose"><MailPlus />Compose</Link></Button>} />
    {preferences.setupRequired ? <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm">{WORKSPACE_SETUP_MESSAGE}</p> : null}
    <section className="grid gap-4 sm:grid-cols-3">
      <Metric label="Emails sent" value={metrics.sent} note="Successfully sent from Northstar" />
      <Metric label="Opens detected" value={metrics.opened} note="Unique emails with an open signal" />
      <Metric label="Replies received" value={metrics.replied} note="Unique emails with a detected reply" />
    </section>
    <section className="grid gap-6 md:grid-cols-2"><Target title="Today's target" sent={metrics.today} target={preferences.daily_target} /><Target title="This month's target" sent={metrics.month} target={preferences.monthly_target} /></section>
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6"><div><p className="font-medium">Gmail</p><p className="text-sm text-muted-foreground">{integration.lastSuccessfulSyncAt ? `Last synced ${formatDateTime(integration.lastSuccessfulSyncAt)}` : "Connect Gmail in Settings to send and sync email."}</p></div><Badge variant={integration.connected ? "default" : "outline"}>{integration.connected ? "Connected" : "Disconnected"}</Badge><Button variant="outline" asChild><Link href="/sent">Review tracker</Link></Button></CardContent></Card>
    <p className="text-xs text-muted-foreground">Totals cover emails sent from Northstar, including removed trackers. Open signals are estimates: blocked images can hide reads, and automatic image loading can register an open.</p>
  </div>;
}
function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold tabular-nums">{value.toLocaleString()}</p><p className="mt-2 text-xs text-muted-foreground">{note}</p></CardContent></Card>;
}
function Target({ title, sent, target }: { title: string; sent: number; target: number }) {
  const percent = target ? Math.min(100, Math.round(sent / target * 100)) : 0;
  return <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>{title}</CardTitle><Link href="/settings" className="text-sm text-primary">Edit target</Link></CardHeader><CardContent><p className="text-3xl font-semibold tabular-nums">{sent.toLocaleString()} <span className="text-base font-normal text-muted-foreground">/ {target ? target.toLocaleString() : "not set"}</span></p>{target ? <><progress aria-label={title} className="mt-4 h-3 w-full accent-primary" value={Math.min(sent, target)} max={target} /><p className="mt-2 text-sm text-muted-foreground">{percent}% complete · {Math.max(0, target - sent).toLocaleString()} remaining</p></> : <p className="mt-4 text-sm text-muted-foreground">Set a target in Settings to track progress.</p>}</CardContent></Card>;
}
