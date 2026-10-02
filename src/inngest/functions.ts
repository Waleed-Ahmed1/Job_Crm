import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncGmailAccount } from "@/lib/email/sync";

export const requestedGmailSync = inngest.createFunction({ id: "gmail-sync-requested", retries: 2, triggers: [{ event: "gmail/sync.requested" }] }, async ({ event, step }) => step.run("bounded-gmail-sync", () => syncGmailAccount(event.data.accountId as string)));

export const scheduledGmailSync = inngest.createFunction({ id: "gmail-sync-schedule", retries: 1, triggers: [{ cron: "*/15 * * * *" }] }, async ({ step }) => { const accounts = await step.run("find-due-accounts", async () => { const admin = createSupabaseAdminClient(); const { data } = await admin.from("email_accounts").select("id,sync_interval_minutes,last_successful_sync_at").eq("status", "connected"); const now = Date.now(); return (data ?? []).filter((account) => !account.last_successful_sync_at || now - new Date(account.last_successful_sync_at).getTime() >= account.sync_interval_minutes * 60_000).map((account) => account.id); }); const results = []; for (const accountId of accounts) results.push(await step.run(`sync-${accountId}`, () => syncGmailAccount(accountId))); return { accounts: accounts.length, results }; });

export const dailyReminderPreparation = inngest.createFunction({ id: "daily-reminder-preparation", retries: 2, triggers: [{ cron: "TZ=Asia/Karachi 0 8 * * *" }] }, async ({ step }) => step.run("mark-reminders-visible", async () => { const admin = createSupabaseAdminClient(); const now = new Date().toISOString(); const { data, error } = await admin.from("tasks").update({ reminder_sent_at: now }).in("status", ["pending","needs_review"]).lte("due_at", now).is("reminder_sent_at", null).select("id"); if (error) throw new Error("Could not prepare reminders"); return { prepared: data.length }; }));

export const inngestFunctions = [requestedGmailSync, scheduledGmailSync, dailyReminderPreparation];
