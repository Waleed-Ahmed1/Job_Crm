import { NextResponse } from "next/server";
import { requireApiViewer } from "@/lib/auth";
import { gmailForAccount } from "@/lib/email/gmail";
import { importGmailThread } from "@/lib/email/import";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST() {
  const viewer = await requireApiViewer();
  const supabase = await createSupabaseServerClient();
  const { data: account } = await supabase.from("email_accounts").select("id,status").eq("owner_id", viewer.id).eq("provider", "gmail").single();
  if (!account || account.status !== "connected") return NextResponse.json({ error: "Gmail is not connected." }, { status: 409 });
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: attempts } = await supabase.from("outbound_send_attempts").select("provider_thread_id").eq("email_account_id", account.id).eq("status", "sent").is("replied_at", null).not("provider_thread_id", "is", null).gte("finished_at", since).order("finished_at", { ascending: false }).limit(25);
  const threadIds = Array.from(new Set((attempts ?? []).flatMap((row) => (row.provider_thread_id ? [row.provider_thread_id as string] : []))));
  const gmail = await gmailForAccount(account.id, viewer.id);
  let checked = 0;
  for (const providerThreadId of threadIds) {
    try {
      await importGmailThread(gmail, { ownerId: viewer.id, accountId: account.id, providerThreadId });
      checked += 1;
    } catch {
      /* keep going with the remaining threads */
    }
  }
  return NextResponse.json({ checked, total: threadIds.length });
}