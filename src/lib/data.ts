import "server-only";
import { DEMO_APPLICATIONS, DEMO_TASKS, DEMO_THREADS } from "@/lib/demo-data";
import type { ApplicationListItem, EmailMessageItem, EmailThreadListItem, SentMailItem, TaskItem } from "@/lib/types";
import { emailWindowStart } from "@/lib/email/window";
import { isMissingWorkspaceSchema } from "@/lib/email/preferences";
import { requireViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AppRow = {
  id: string; role_title: string; stage: string; location: string | null; work_arrangement: string | null;
  applied_at: string | null; saved_at: string; priority: string; tags: string[] | null;
  companies: { id: string; name: string } | { id: string; name: string }[] | null;
  tasks: { title: string; due_at: string; status: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }

export async function listApplications(): Promise<ApplicationListItem[]> {
  const viewer = await requireViewer();
  if (viewer.demo) return DEMO_APPLICATIONS;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("applications").select("id, role_title, stage, location, work_arrangement, applied_at, saved_at, priority, tags, companies(id, name), tasks(title, due_at, status)").is("archived_at", null).order("updated_at", { ascending: false });
  if (error) throw new Error("Could not load applications");
  return ((data ?? []) as unknown as AppRow[]).map((row) => {
    const company = one(row.companies);
    const next = row.tasks?.filter((task) => task.status === "pending").sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
    return { id: row.id, role: row.role_title, company: company?.name ?? "Unknown company", companyId: company?.id, stage: row.stage as ApplicationListItem["stage"], location: row.location, workArrangement: row.work_arrangement as ApplicationListItem["workArrangement"], appliedAt: row.applied_at, savedAt: row.saved_at, priority: row.priority as ApplicationListItem["priority"], tags: row.tags ?? [], nextAction: next?.title ?? null, nextActionAt: next?.due_at ?? null };
  });
}

type TaskRow = { id: string; title: string; due_at: string; status: TaskItem["status"]; kind: TaskItem["kind"]; application_id: string | null; applications: { role_title: string; companies: { name: string } | { name: string }[] | null } | null };
export async function listTasks(): Promise<TaskItem[]> {
  const viewer = await requireViewer();
  if (viewer.demo) return DEMO_TASKS;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("tasks").select("id, title, due_at, status, kind, application_id, applications(role_title, companies(name))").neq("status", "cancelled").order("due_at");
  if (error) throw new Error("Could not load tasks");
  return ((data ?? []) as unknown as TaskRow[]).map((row) => { const company = row.applications ? one(row.applications.companies) : null; return { id: row.id, title: row.title, dueAt: row.due_at, status: row.status, kind: row.kind, applicationId: row.application_id, applicationLabel: row.applications ? `${row.applications.role_title} · ${company?.name ?? "Unknown"}` : null }; });
}

type ThreadRow = { id: string; provider_thread_id: string; subject: string | null; snippet: string | null; participant_emails: string[] | null; last_message_at: string; unread_count: number; thread_applications: { applications: { role_title: string; companies: { name: string } | { name: string }[] | null } }[] | null };
export async function listThreads(): Promise<EmailThreadListItem[]> {
  const viewer = await requireViewer();
  if (viewer.demo) return DEMO_THREADS.filter((thread) => thread.lastMessageAt >= emailWindowStart()).map((thread) => ({ ...thread, applicationLabel: null }));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("email_threads").select("id, provider_thread_id, subject, snippet, participant_emails, last_message_at, unread_count").eq("owner_id", viewer.id).gte("last_message_at", emailWindowStart()).order("last_message_at", { ascending: false }).limit(50);
  if (error) throw new Error("Could not load email conversations");
  return ((data ?? []) as unknown as ThreadRow[]).map((row) => { const app = row.thread_applications?.[0]?.applications; const company = app ? one(app.companies) : null; return { id: row.id, providerThreadId: row.provider_thread_id, subject: row.subject ?? "(no subject)", snippet: row.snippet ?? "", participants: row.participant_emails ?? [], lastMessageAt: row.last_message_at, unread: row.unread_count > 0, applicationLabel: app ? `${app.role_title} · ${company?.name ?? "Unknown"}` : null }; });
}

export async function getThreadDetail(id: string): Promise<{ thread: EmailThreadListItem; messages: EmailMessageItem[]; gmailPermalink: string | null } | null> {
  const viewer = await requireViewer();
  if (viewer.demo) { const thread = DEMO_THREADS.find((item) => item.id === id); if (!thread) return null; return { thread, gmailPermalink: null, messages: [{ id: "demo-message-1", direction: "incoming", from: "recruiter@example.com", to: [viewer.email], subject: thread.subject, sentAt: thread.lastMessageAt, bodyText: "This is clearly labeled sample content. Could you share your availability for the next conversation?", rfcMessageId: "<sample@example.invalid>" }] }; }
  const supabase = await createSupabaseServerClient();
  const [{ data: threadRow }, { data: messageRows }] = await Promise.all([supabase.from("email_threads").select("id,provider_thread_id,subject,snippet,participant_emails,last_message_at,unread_count,gmail_permalink,thread_applications(applications(role_title,companies(name)))").eq("id", id).single(), supabase.from("email_messages").select("id,direction,from_address,to_addresses,subject,sent_at,body_text,rfc_message_id").eq("email_thread_id", id).order("sent_at")]);
  if (!threadRow) return null; const typed = threadRow as unknown as ThreadRow & { gmail_permalink: string | null }; const app = typed.thread_applications?.[0]?.applications; const company = app ? one(app.companies) : null;
  const thread: EmailThreadListItem = { id: typed.id, providerThreadId: typed.provider_thread_id, subject: typed.subject ?? "(no subject)", snippet: typed.snippet ?? "", participants: typed.participant_emails ?? [], lastMessageAt: typed.last_message_at, unread: typed.unread_count > 0, applicationLabel: app ? `${app.role_title} · ${company?.name ?? "Unknown"}` : null };
  const messages = ((messageRows ?? []) as unknown as { id: string; direction: "incoming" | "outgoing"; from_address: string; to_addresses: string[]; subject: string | null; sent_at: string; body_text: string | null; rfc_message_id: string | null }[]).map((row) => ({ id: row.id, direction: row.direction, from: row.from_address, to: row.to_addresses, subject: row.subject, sentAt: row.sent_at, bodyText: row.body_text ?? "", rfcMessageId: row.rfc_message_id }));
  return { thread, messages, gmailPermalink: typed.gmail_permalink };
}

export async function getApplication(id: string) {
  const viewer = await requireViewer();
  if (viewer.demo) return DEMO_APPLICATIONS.find((item) => item.id === id) ?? null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("applications").select("*, companies(id,name), resume_versions(id,label,version_number), application_contacts(contacts(id,name,email,title)), tasks(*), interviews(*), thread_applications(email_threads(id,subject,snippet,last_message_at))").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function getIntegrationStatus() {
  const viewer = await requireViewer();
  if (viewer.demo) return { connected: false, lastSuccessfulSyncAt: null, coverage: "Sample data only" };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("email_accounts").select("status, last_successful_sync_at, sync_query, import_after").eq("owner_id", viewer.id).eq("provider", "gmail").maybeSingle();
  if (error) throw new Error("Could not load Gmail connection status. Check database access and migrations.");
  return { connected: data?.status === "connected", lastSuccessfulSyncAt: data?.last_successful_sync_at ?? null, coverage: data ? "Latest 50 conversations from the last 3 days" : "Not connected" };
}

export type TrackerFilter = "all" | "unopened" | "opened" | "replied" | "failed";
type SentRow = { id: string; status: SentMailItem["status"]; subject: string | null; to_addresses: string[] | null; started_at: string | null; finished_at: string | null; tracking_token: string | null; first_opened_at: string | null; open_count: number; replied_at: string | null };
export async function listSentMail({ filter = "all", page = 0 }: { filter?: TrackerFilter; page?: number } = {}): Promise<SentMailItem[]> {
  const viewer = await requireViewer();
  if (viewer.demo) return [];
  const supabase = await createSupabaseServerClient();
  function query(archiveFilter: boolean) {
    let request = supabase.from("outbound_send_attempts").select("id,status,subject,to_addresses,started_at,finished_at,tracking_token,first_opened_at,open_count,replied_at").eq("owner_id", viewer.id);
    if (archiveFilter) request = request.is("archived_at", null);
    if (filter === "opened") request = request.eq("status", "sent").not("first_opened_at", "is", null);
    if (filter === "replied") request = request.eq("status", "sent").not("replied_at", "is", null);
    if (filter === "unopened") request = request.eq("status", "sent").not("tracking_token", "is", null).is("first_opened_at", null);
    if (filter === "failed") request = request.eq("status", "failed");
    return request.order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * 50, page * 50 + 50);
  }
  let result = await query(true);
  // Keep the existing tracker readable if code arrives before the additive migration.
  if (isMissingWorkspaceSchema(result.error)) result = await query(false);
  if (result.error) throw new Error("Could not load sent mail");
  return ((result.data ?? []) as SentRow[]).map((row) => ({
    id: row.id, status: row.status, recipients: row.to_addresses ?? [], subject: row.subject ?? "(no subject)",
    sentAt: row.finished_at ?? row.started_at, tracked: Boolean(row.tracking_token),
    firstOpenedAt: row.first_opened_at, openCount: row.open_count, repliedAt: row.replied_at
  }));
}
