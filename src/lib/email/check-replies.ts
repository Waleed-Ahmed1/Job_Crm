import "server-only";
import { gmailForAccount } from "@/lib/email/gmail";
import { importGmailThread } from "@/lib/email/import";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export async function checkTrackedReplies(accountId: string, ownerId: string, alreadyImported = new Set<string>()) {
  const admin = createSupabaseAdminClient();
  const { data: attempts, error } = await admin.from("outbound_send_attempts")
    .select("id,provider_thread_id,finished_at").eq("owner_id", ownerId).eq("email_account_id", accountId)
    .eq("status", "sent").is("replied_at", null).is("archived_at", null)
    .not("provider_thread_id", "is", null)
    .order("reconciliation_checked_at", { ascending: true, nullsFirst: true }).order("finished_at", { ascending: false }).limit(25);
  if (error) throw new Error("Could not load tracked conversations.");
  if (!attempts?.length) return { checked: 0, total: 0 };
  const threadIds = [...new Set(attempts.map((attempt) => attempt.provider_thread_id as string))];
  const gmail = await gmailForAccount(accountId, ownerId);
  let checked = 0;
  for (const providerThreadId of threadIds) {
    try {
      if (!alreadyImported.has(providerThreadId)) {
        const sentDates = attempts.filter((attempt) => attempt.provider_thread_id === providerThreadId)
          .flatMap((attempt) => attempt.finished_at ? [attempt.finished_at as string] : []).sort();
        await importGmailThread(gmail, { ownerId, accountId, providerThreadId, since: sentDates[0] });
      }
      checked += 1;
    } catch { /* Continue so one unavailable conversation cannot block the rest. */ }
    // Rotate through older tracked threads instead of checking the same newest 25 forever.
    const { error: updateError } = await admin.from("outbound_send_attempts")
      .update({ reconciliation_checked_at: new Date().toISOString() })
      .eq("owner_id", ownerId).eq("email_account_id", accountId).eq("provider_thread_id", providerThreadId).eq("status", "sent");
    if (updateError) throw new Error("Could not record reply check progress.");
  }
  return { checked, total: threadIds.length };
}
