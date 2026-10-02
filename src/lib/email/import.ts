import "server-only";
import type { gmail_v1 } from "googleapis";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeEmailHtml } from "@/lib/email/sanitize";

type HeaderMap = Record<string, string>;
function headers(message: gmail_v1.Schema$Message): HeaderMap { return Object.fromEntries((message.payload?.headers ?? []).map((item) => [(item.name ?? "").toLowerCase(), item.value ?? ""])); }
function decode(data?: string | null) { return data ? Buffer.from(data, "base64url").toString("utf8") : ""; }
function addresses(value = "") { return Array.from(value.matchAll(/(?:^|,)[^<,]*<?([^\s<>,]+@[^\s<>,]+)>?/g)).map((match) => match[1]!.toLowerCase()); }
function bodyParts(part?: gmail_v1.Schema$MessagePart): { text: string; html: string; attachments: gmail_v1.Schema$MessagePart[] } { if (!part) return { text: "", html: "", attachments: [] }; let text = part.mimeType === "text/plain" ? decode(part.body?.data) : ""; let html = part.mimeType === "text/html" ? decode(part.body?.data) : ""; const attachments = part.filename && part.body?.attachmentId ? [part] : []; for (const child of part.parts ?? []) { const nested = bodyParts(child); text += nested.text; html += nested.html; attachments.push(...nested.attachments); } return { text, html, attachments }; }

export async function importGmailThread(gmail: gmail_v1.Gmail, input: { ownerId: string; accountId: string; providerThreadId: string; since?: string }) {
  const response = await gmail.users.threads.get({ userId: "me", id: input.providerThreadId, format: input.since ? "metadata" : "full" });
  let messages = response.data.messages ?? [];
  if (input.since) {
    const since = new Date(input.since).getTime();
    const recent = messages.filter((message) => Number(message.internalDate ?? 0) >= since);
    messages = [];
    // Fetch only recent bodies, not every old message in a long-running thread.
    for (const message of recent) {
      if (!message.id) continue;
      const full = await gmail.users.messages.get({ userId: "me", id: message.id, format: "full" });
      messages.push(full.data);
    }
  }
  if (!messages.length) return null;
  const parsed = messages.map((message) => { const h = headers(message); const body = bodyParts(message.payload); const sentAt = new Date(Number(message.internalDate ?? Date.now())).toISOString(); return { source: message, headers: h, body, sentAt, incoming: !(message.labelIds ?? []).includes("SENT"), participants: [...addresses(h.from), ...addresses(h.to), ...addresses(h.cc)] }; });
  const latest = [...parsed].sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0]!; const participantEmails = Array.from(new Set(parsed.flatMap((item) => item.participants))); const admin = createSupabaseAdminClient();
  const { data: thread, error: threadError } = await admin.from("email_threads").upsert({ owner_id: input.ownerId, email_account_id: input.accountId, provider_thread_id: input.providerThreadId, subject: latest.headers.subject || "(no subject)", snippet: latest.source.snippet ?? "", participant_emails: participantEmails, last_message_at: latest.sentAt, unread_count: messages.filter((item) => (item.labelIds ?? []).includes("UNREAD")).length, gmail_permalink: `https://mail.google.com/mail/u/0/#all/${input.providerThreadId}` }, { onConflict: "email_account_id,provider_thread_id" }).select("id").single(); if (threadError) throw new Error("Could not store Gmail thread");
  for (const item of parsed) { if (!item.source.id) continue; const { data: stored, error } = await admin.from("email_messages").upsert({ owner_id: input.ownerId, email_account_id: input.accountId, email_thread_id: thread.id, provider_message_id: item.source.id, provider_history_id: item.source.historyId ?? null, rfc_message_id: item.headers["message-id"] || null, in_reply_to: item.headers["in-reply-to"] || null, reference_headers: item.headers.references?.split(/\s+/).filter(Boolean) ?? [], direction: item.incoming ? "incoming" : "outgoing", from_address: addresses(item.headers.from)[0] ?? item.headers.from ?? "unknown", to_addresses: addresses(item.headers.to), cc_addresses: addresses(item.headers.cc), bcc_addresses: addresses(item.headers.bcc), reply_to_addresses: addresses(item.headers["reply-to"]), subject: item.headers.subject || null, sent_at: item.sentAt, received_at: item.incoming ? item.sentAt : null, body_text: item.body.text.slice(0, 200000), body_html_sanitized: item.body.html ? sanitizeEmailHtml(item.body.html).slice(0, 500000) : null, snippet: item.source.snippet ?? null, label_ids: item.source.labelIds ?? [], has_attachments: item.body.attachments.length > 0, raw_headers: { date: item.headers.date, from: item.headers.from, to: item.headers.to, cc: item.headers.cc, subject: item.headers.subject } }, { onConflict: "email_account_id,provider_message_id" }).select("id").single(); if (error) throw new Error("Could not store Gmail message");
    for (const attachment of item.body.attachments) await admin.from("email_attachments").upsert({ owner_id: input.ownerId, email_message_id: stored.id, provider_attachment_id: attachment.body!.attachmentId!, filename: attachment.filename!, mime_type: attachment.mimeType ?? null, size_bytes: attachment.body?.size ?? null, content_id: attachment.headers?.find((h) => h.name?.toLowerCase() === "content-id")?.value ?? null }, { onConflict: "email_message_id,provider_attachment_id,filename" });
    if (item.incoming) { if (!/mailer-daemon|postmaster/i.test(addresses(item.headers.from)[0] ?? "")) await admin.from("outbound_send_attempts").update({ replied_at: item.sentAt }).eq("owner_id", input.ownerId).eq("email_account_id", input.accountId).eq("provider_thread_id", input.providerThreadId).is("replied_at", null).is("archived_at", null).eq("status", "sent").lt("finished_at", item.sentAt); const { data: links } = await admin.from("thread_applications").select("application_id").eq("email_thread_id", thread.id).eq("owner_id", input.ownerId); const appIds = (links ?? []).map((link) => link.application_id); if (appIds.length) await admin.from("tasks").update({ status: "needs_review", reply_message_id: stored.id }).eq("owner_id", input.ownerId).in("application_id", appIds).eq("kind", "follow_up").eq("status", "pending"); }
  }
  return { id: thread.id, providerThreadId: input.providerThreadId, messageCount: messages.length, subject: latest.headers.subject || "(no subject)" };
}