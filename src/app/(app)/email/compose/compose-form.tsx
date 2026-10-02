"use client";
import { useState } from "react";
import { Bot, Paperclip, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
type Draft = { to: string; cc: string; bcc: string; subject: string; body: string };
type Reply = { threadId: string; localThreadId: string; to: string; subject: string; inReplyTo?: string; references: string[] };
type Status = { kind: "idle" | "working" | "success" | "error" | "uncertain"; message?: string };
const purposes = ["Recruiter outreach", "Application introduction", "Follow-up", "Reply to recruiter", "Interview thank-you", "Rewrite professionally", "Make shorter"];
const allowedTypes = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"]);
const maxAttachmentBytes = 3 * 1024 * 1024;
export function ComposeForm({ reply: initialReply }: { reply?: Reply }) {
  const [reply, setReply] = useState(initialReply);
  const [draft, setDraft] = useState<Draft>({ to: reply?.to ?? "", cc: "", bcc: "", subject: reply?.subject ?? "", body: "" });
  const [original, setOriginal] = useState<Draft | null>(null);
  const [purpose, setPurpose] = useState(purposes[0]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [files, setFiles] = useState<File[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [sent, setSent] = useState(false);
  const busy = status.kind === "working";
  const locked = busy || sent || status.kind === "uncertain";
  const update = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  function attach(selected: File[]) {
    const combined = [...files];
    for (const file of selected) {
      if (!allowedTypes.has(file.type)) { setStatus({ kind: "error", message: "Use PDF, DOCX, PNG, or JPEG attachments." }); return; }
      if (!combined.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) combined.push(file);
    }
    if (combined.length > 5 || combined.reduce((sum, file) => sum + file.size, 0) > maxAttachmentBytes) {
      setStatus({ kind: "error", message: "Use up to 5 attachments totaling 3 MB or less." }); return;
    }
    setFiles(combined); setStatus({ kind: "idle" });
  }
  async function generate() {
    setStatus({ kind: "working", message: "Generating a draft..." }); setOriginal(draft);
    try {
      const response = await fetch("/api/ai/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, threadId: reply?.localThreadId, purpose, tone: "professional", length: "concise" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Generation failed");
      setDraft((current) => ({ ...current, subject: result.subject ?? current.subject, body: result.body ?? current.body }));
      setStatus({ kind: "success", message: result.missingInformation?.length ? `Review placeholders: ${result.missingInformation.join(", ")}` : "Draft generated. Review before sending." });
    } catch (error) { setStatus({ kind: "error", message: error instanceof Error ? error.message : "Generation failed" }); }
  }
  async function sendMessage() {
    if (locked || !confirm(`Send this message to ${draft.to}?`)) return;
    setStatus({ kind: "working", message: "Sending..." });
    let requestStarted = false;
    try {
      const attachments = await Promise.all(files.map(async (file) => ({ filename: file.name, contentType: file.type, contentBase64: arrayBufferToBase64(await file.arrayBuffer()) })));
      requestStarted = true;
      const response = await fetch("/api/gmail/send", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify({
        to: splitAddresses(draft.to), cc: splitAddresses(draft.cc), bcc: splitAddresses(draft.bcc), subject: draft.subject,
        bodyText: draft.body, attachments, threadId: reply?.threadId, inReplyTo: reply?.inReplyTo, references: reply?.references
      }) });
      const result = await response.json().catch(() => ({}));
      if (result.status === "uncertain" || result.status === "sending") { setStatus({ kind: "uncertain", message: "Delivery is unresolved. Check Sent tracker and Gmail before composing another copy." }); return; }
      if (result.status === "failed") {
        setIdempotencyKey(crypto.randomUUID());
        throw new Error(result.error ?? "Gmail rejected the send. Review the message before retrying.");
      }
      if (response.status >= 500) {
        setStatus({ kind: "uncertain", message: "The server did not confirm delivery. Check Gmail and the tracker before trying again." }); return;
      }
      if (!response.ok) throw new Error(result.error ?? "Send failed");
      // A 200 response must explicitly confirm sent status.
      if (result.status !== "sent") { setStatus({ kind: "uncertain", message: "The server did not confirm delivery. Check Gmail and the tracker." }); return; }
      setSent(true); setStatus({ kind: "success", message: "Email sent. Review its status in Email tracker." });
    } catch (error) {
      if (requestStarted && error instanceof TypeError) {
        setStatus({ kind: "uncertain", message: "Connection interrupted. Delivery may have succeeded. Check Gmail and the tracker before sending again." });
      } else setStatus({ kind: "error", message: error instanceof Error ? error.message : "Send failed" });
    }
  }
  function newMessage() {
    setReply(undefined); setDraft({ to: "", cc: "", bcc: "", subject: "", body: "" }); setFiles([]);
    setOriginal(null); setSent(false); setIdempotencyKey(crypto.randomUUID()); setStatus({ kind: "idle" });
  }
  return <div className="grid gap-6 xl:grid-cols-[1fr_280px]"><div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3"><Field label="To" value={draft.to} onChange={(value) => update("to", value)} disabled={locked} required /><Field label="CC" value={draft.cc} onChange={(value) => update("cc", value)} disabled={locked} /><Field label="BCC" value={draft.bcc} onChange={(value) => update("bcc", value)} disabled={locked} /></div>
    <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" value={draft.subject} disabled={locked} onChange={(event) => update("subject", event.target.value)} required /></div>
    <div className="space-y-2"><Label htmlFor="body">Message</Label><Textarea id="body" value={draft.body} disabled={locked} onChange={(event) => update("body", event.target.value)} className="min-h-[340px] font-sans leading-7" required /></div>
    <div className="space-y-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"><Paperclip className="size-4" />Add attachments<input aria-label="Add attachments" className="sr-only" type="file" multiple accept=".pdf,.docx,.png,.jpg,.jpeg" disabled={locked} onChange={(event) => { attach(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label>
      <p className="text-xs text-muted-foreground">PDF, DOCX, PNG, or JPEG · Up to 5 files, 3 MB total.</p>
      {files.length ? <ul className="space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2"><div className="min-w-0"><p className="truncate text-sm">{file.name}</p><p className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB</p></div><Button variant="ghost" size="icon" aria-label={`Remove ${file.name}`} disabled={locked} onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}><X className="size-4" /></Button></li>)}</ul> : null}
    </div>
    <div className="flex flex-wrap justify-end gap-2">{original && !sent ? <Button variant="ghost" disabled={locked} onClick={() => { setDraft(original); setOriginal(null); }}>Discard AI changes</Button> : null}{sent ? <Button onClick={newMessage}>New message</Button> : <Button onClick={sendMessage} disabled={locked || !draft.to || !draft.subject || !draft.body}><Send />Send</Button>}</div>
    {status.message ? <p role="status" className={`rounded-lg p-3 text-sm ${status.kind === "error" || status.kind === "uncertain" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{status.message}</p> : null}
  </div><aside className="h-fit rounded-2xl border bg-muted/45 p-5"><div className="flex items-center gap-2"><Bot className="size-5 text-primary" /><h2 className="font-semibold">Writing assistant</h2></div><p className="mt-2 text-sm text-muted-foreground">Generate a suggestion, then review and edit it.</p><div className="mt-5 space-y-4"><Label htmlFor="purpose">Action</Label><select id="purpose" value={purpose} disabled={locked} onChange={(event) => setPurpose(event.target.value)} className="h-10 w-full rounded-lg border bg-white px-3 text-sm">{purposes.map((item) => <option key={item}>{item}</option>)}</select><Button className="w-full" variant="outline" onClick={generate} disabled={locked}><Sparkles />Generate suggestion</Button></div></aside></div>;
}
function Field({ label, value, onChange, required, disabled }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; disabled?: boolean }) {
  return <div className="space-y-2"><Label htmlFor={label.toLowerCase()}>{label}</Label><Input id={label.toLowerCase()} value={value} onChange={(event) => onChange(event.target.value)} placeholder="name@example.com" required={required} disabled={disabled} /></div>;
}
function splitAddresses(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function arrayBufferToBase64(buffer: ArrayBuffer) { const bytes = new Uint8Array(buffer); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); }
