import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiViewer } from "@/lib/auth";
import { gmailForAccount } from "@/lib/email/gmail";
import { importGmailThread } from "@/lib/email/import";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_: Request, context: { params: Promise<{ threadId: string }> }) {
  const viewer = await requireApiViewer(); const { threadId } = await context.params;
  const valid = z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).safeParse(threadId);
  if (!valid.success) return NextResponse.json({ error: "Invalid Gmail thread ID." }, { status: 400 });
  const supabase = await createSupabaseServerClient(); const { data: account } = await supabase.from("email_accounts").select("id,status").eq("owner_id", viewer.id).eq("provider", "gmail").single();
  if (!account || account.status !== "connected") return NextResponse.json({ error: "Gmail is not connected." }, { status: 409 });
  const gmail = await gmailForAccount(account.id, viewer.id); const imported = await importGmailThread(gmail, { ownerId: viewer.id, accountId: account.id, providerThreadId: valid.data }); return NextResponse.json(imported);
}
