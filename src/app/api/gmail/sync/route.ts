import { NextResponse } from "next/server";
import { requireApiViewer } from "@/lib/auth";
import { inngest } from "@/inngest/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function POST() { const viewer = await requireApiViewer(); const supabase = await createSupabaseServerClient(); const { data: account } = await supabase.from("email_accounts").select("id,status").eq("owner_id", viewer.id).eq("provider", "gmail").single(); if (!account || account.status !== "connected") return NextResponse.json({ error: "Gmail is not connected." }, { status: 409 }); await inngest.send({ name: "gmail/sync.requested", data: { accountId: account.id, ownerId: viewer.id } }); return NextResponse.json({ status: "queued" }, { status: 202 }); }
