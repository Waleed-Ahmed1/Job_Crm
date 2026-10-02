import { NextResponse } from "next/server";
import { requireApiViewer } from "@/lib/auth";
import { inngest } from "@/inngest/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const viewer = await requireApiViewer();
    const supabase = await createSupabaseServerClient();
    const { data: account, error } = await supabase.from("email_accounts").select("id,status").eq("owner_id", viewer.id).eq("provider", "gmail").maybeSingle();
    if (error) return NextResponse.json({ error: "Could not load your Gmail account. Check Supabase configuration and database access." }, { status: 500 });
    if (!account || account.status !== "connected") return NextResponse.json({ error: "Gmail is not connected." }, { status: 409 });

    const isCloud = process.env.NODE_ENV === "production" && process.env.INNGEST_DEV !== "1" && process.env.INNGEST_DEV !== "true";
    if (isCloud) {
      const missing = ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"].filter((name) => {
        const value = process.env[name]?.trim();
        return !value || /your[-_]|placeholder/i.test(value);
      });
      if (missing.length) return NextResponse.json({ error: `Gmail sync is not configured. Set ${missing.join(" and ")} in Vercel and redeploy, then register /api/inngest in Inngest.` }, { status: 503 });
    }

    try {
      await inngest.send({ name: "gmail/sync.requested", data: { accountId: account.id, ownerId: viewer.id } });
    } catch {
      console.error("Gmail sync event submission failed. Check the Inngest event key and service availability.");
      return NextResponse.json({ error: "Could not queue Gmail sync. Check that INNGEST_EVENT_KEY belongs to your Inngest environment and that Inngest is available." }, { status: 502 });
    }
    return NextResponse.json({ status: "queued" }, { status: 202 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Gmail sync request failed before queueing. Check server configuration and Supabase access.");
    return NextResponse.json({ error: "Could not start Gmail sync. Check the Vercel runtime logs and server environment variables." }, { status: 500 });
  }
}