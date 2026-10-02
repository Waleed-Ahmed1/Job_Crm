import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ComposeForm } from "@/app/(app)/email/compose/compose-form";
import { getThreadDetail } from "@/lib/data";
export default async function ComposePage({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  const params = await searchParams;
  const detail = params.thread ? await getThreadDetail(params.thread) : null;
  const last = detail?.messages.at(-1);
  const incoming = detail?.messages.filter((message) => message.direction === "incoming").at(-1);
  return <div className="space-y-7"><PageHeader title="Compose email" description="Write, review, and send your message." /><Card><CardHeader><CardTitle>{detail ? "Reply" : "New message"}</CardTitle></CardHeader><CardContent><ComposeForm reply={detail ? { threadId: detail.thread.providerThreadId, localThreadId: detail.thread.id, to: incoming?.from ?? detail.thread.participants.join(", "), subject: /^re:/i.test(detail.thread.subject) ? detail.thread.subject : `Re: ${detail.thread.subject}`, inReplyTo: last?.rfcMessageId ?? undefined, references: detail.messages.flatMap((message) => message.rfcMessageId ? [message.rfcMessageId] : []) } : undefined} /></CardContent></Card></div>;
}
