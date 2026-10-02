import "server-only";
import { randomUUID } from "node:crypto";
import { gmailForAccount } from "@/lib/email/gmail";
import { importGmailThread } from "@/lib/email/import";
import { checkTrackedReplies } from "@/lib/email/check-replies";
import { recentMailQuery, emailWindowStart } from "@/lib/email/window";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function syncGmailAccount(accountId: string) {
  const admin = createSupabaseAdminClient();
  const { data: account, error } = await admin.from("email_accounts").select("id,owner_id,status").eq("id", accountId).single();
  if (error || !account || account.status !== "connected") throw new Error("Gmail account is unavailable");
  const lock = randomUUID();
  const now = new Date();
  const { data: claimed, error: lockError } = await admin.from("sync_state")
    .update({ status: "running", lock_token: lock, lock_expires_at: new Date(now.getTime() + 10 * 60000).toISOString(), last_attempt_at: now.toISOString(), error_code: null, safe_error_message: null })
    .eq("email_account_id", accountId).or(`lock_expires_at.is.null,lock_expires_at.lt.${now.toISOString()}`)
    .select("id").maybeSingle();
  if (lockError) throw new Error("Could not claim Gmail sync");
  if (!claimed) return { status: "already_running" as const };
  try {
    const gmail = await gmailForAccount(accountId, account.owner_id);
    // Start from the newest recent mail every run. Never reuse old full-sync page tokens.
    const listed = await gmail.users.threads.list({ userId: "me", q: recentMailQuery(now), maxResults: 50 });
    const threadIds = [...new Set((listed.data.threads ?? []).flatMap((thread) => thread.id ? [thread.id] : []))];
    let imported = 0;
    for (const providerThreadId of threadIds) {
      await importGmailThread(gmail, { ownerId: account.owner_id, accountId, providerThreadId, since: emailWindowStart(now) });
      imported += 1;
    }
    const replies = await checkTrackedReplies(accountId, account.owner_id, new Set(threadIds));
    const completedAt = new Date().toISOString();
    const { error: stateError } = await admin.from("sync_state").update({
      status: "idle", progress_current: imported, last_successful_at: completedAt,
      lock_token: null, lock_expires_at: null
    }).eq("email_account_id", accountId).eq("lock_token", lock);
    if (stateError) throw new Error("Could not finish Gmail sync");
    const { error: accountError } = await admin.from("email_accounts").update({ last_successful_sync_at: completedAt, last_error_code: null, last_error_at: null }).eq("id", accountId);
    if (accountError) throw new Error("Could not record Gmail sync");
    return { status: "complete" as const, imported, repliesChecked: replies.checked };
  } catch (error) {
    await admin.from("sync_state").update({ status: "failed", lock_token: null, lock_expires_at: null, error_code: "SYNC_FAILED", safe_error_message: "Gmail synchronization failed. Check setup or reconnect." }).eq("email_account_id", accountId).eq("lock_token", lock);
    await admin.from("email_accounts").update({ last_error_code: "SYNC_FAILED", last_error_at: new Date().toISOString() }).eq("id", accountId);
    throw error;
  }
}
