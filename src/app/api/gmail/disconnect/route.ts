import { NextResponse } from "next/server";
import { requireApiViewer } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { oauthForAccount } from "@/lib/email/gmail";
export async function POST() { const viewer = await requireApiViewer(); const supabase = await createSupabaseServerClient(); const { data: account } = await supabase.from("email_accounts").select("id").eq("provider", "gmail").maybeSingle(); if (!account) return NextResponse.json({ ok: true }); try { const oauth = await oauthForAccount(account.id, viewer.id); const token = await oauth.getAccessToken(); if (token.token) await oauth.revokeToken(token.token); } catch { /* Local disconnect still proceeds if provider revocation is unavailable. */ } const admin = createSupabaseAdminClient(); await admin.rpc("delete_oauth_credential", { p_account_id: account.id }); await admin.from("email_accounts").update({ status: "disconnected" }).eq("id", account.id).eq("owner_id", viewer.id); return NextResponse.json({ ok: true }); }
