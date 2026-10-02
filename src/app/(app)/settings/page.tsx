import { logout } from "@/app/login/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmailTargetForm } from "@/components/email-target-form";
import { DisconnectGmailButton } from "@/components/disconnect-gmail-button";
import { getIntegrationStatus } from "@/lib/data";
import { getEmailPreferences, WORKSPACE_SETUP_MESSAGE } from "@/lib/email/preferences";
import { requireViewer } from "@/lib/auth";
const gmailErrors: Record<string, string> = {
  server_config: "Gmail could not be saved. Check the Supabase server credential.",
  encryption: "Gmail token encryption is not configured.",
  google: "Google authorization failed. Check OAuth configuration and reconnect.",
  database: "Could not save the Gmail connection. Check database access.",
  credential: "Could not save Gmail offline access. Reconnect with Google consent."
};
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ gmail?: string; gmail_error?: string }> }) {
  const [query, viewer, integration, preferences] = await Promise.all([searchParams, requireViewer(), getIntegrationStatus(), getEmailPreferences()]);
  return <div className="space-y-7"><PageHeader title="Settings" description="Manage Gmail and your email targets." />
    {preferences.setupRequired ? <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm">{WORKSPACE_SETUP_MESSAGE}</p> : null}
    <div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>Email targets</CardTitle><CardDescription>Keep daily and monthly outreach progress visible.</CardDescription></CardHeader><CardContent><EmailTargetForm daily={preferences.daily_target} monthly={preferences.monthly_target} disabled={viewer.demo || preferences.setupRequired} /></CardContent></Card>
    <Card id="gmail"><CardHeader><CardTitle>Gmail connection</CardTitle></CardHeader><CardContent className="space-y-4">
      {query.gmail === "error" ? <p role="alert" className="text-sm text-destructive">{gmailErrors[query.gmail_error ?? ""] ?? "Gmail connection failed. Check configuration and reconnect."}</p> : null}
      {query.gmail === "connected" && integration.connected ? <p role="status" className="text-sm text-primary">Gmail connected. Open Email to sync recent conversations.</p> : null}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-4"><div><p className="font-medium">{viewer.email}</p><p className="text-xs text-muted-foreground">Read mail and send email</p></div><Badge variant={integration.connected ? "default" : "outline"}>{integration.connected ? "Connected" : "Disconnected"}</Badge></div>
      <div className="flex flex-wrap gap-2"><Button asChild={!viewer.demo} disabled={viewer.demo}>{viewer.demo ? "Connect Gmail" : <a href="/api/gmail/oauth/start">{integration.connected ? "Reconnect Gmail" : "Connect Gmail"}</a>}</Button>{integration.connected ? <DisconnectGmailButton disabled={viewer.demo} /> : null}</div>
      <p className="text-sm text-muted-foreground">The inbox shows the last 3 days. Older tracked emails remain available in the tracker.</p>
    </CardContent></Card></div>
    <form action={logout}><Button variant="outline">Sign out</Button></form>
  </div>;
}
