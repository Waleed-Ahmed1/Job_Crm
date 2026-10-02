import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { requireApiViewer } from "@/lib/auth";
import { createGoogleOAuthClient } from "@/lib/email/gmail";
import { encryptSecret, secureEqual } from "@/lib/security/crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const viewer = await requireApiViewer();
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const expected = request.cookies.get("gmail_oauth_state")?.value;
  if (!state || !expected || !secureEqual(state, expected) || !code) return NextResponse.json({ error: "Invalid or expired OAuth callback." }, { status: 400 });
  let failure = "google";
  try {
    failure = "server_config";
    if (!serverEnv.serviceRoleKey || serverEnv.serviceRoleKey.includes("your-")) throw new Error("Missing server credential");
    failure = "encryption";
    // Validate encryption before changing any saved account state.
    encryptSecret("configuration-check");
    failure = "google";
    const oauth = createGoogleOAuthClient();
    const { tokens } = await oauth.getToken(code);
    oauth.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth });
    const profile = await gmail.users.getProfile({ userId: "me" });
    if (!profile.data.emailAddress) throw new Error("Gmail did not return an account address");
    failure = "database";
    const admin = createSupabaseAdminClient();
    const { data: account, error } = await admin.from("email_accounts").upsert({ owner_id: viewer.id, provider: "gmail", provider_account_id: profile.data.emailAddress.toLowerCase(), email_address: profile.data.emailAddress.toLowerCase(), status: "needs_reconnect", granted_scopes: (tokens.scope ?? "").split(" ").filter(Boolean), last_error_code: null, last_error_at: null }, { onConflict: "owner_id,provider" }).select("id").single();
    if (error || !account) throw new Error("Could not save Gmail account metadata");
    failure = "credential";
    if (tokens.refresh_token) {
      const stored = await admin.rpc("store_oauth_credential", { p_owner_id: viewer.id, p_account_id: account.id, p_encrypted_refresh_token: encryptSecret(tokens.refresh_token), p_key_version: 1 });
      if (stored.error) throw new Error("Could not store encrypted Gmail credential");
    } else {
      const existing = await admin.rpc("get_oauth_credential", { p_account_id: account.id });
      if (existing.error || !existing.data) throw new Error("No refresh token available");
    }
    failure = "database";
    const sync = await admin.from("sync_state").upsert({ owner_id: viewer.id, email_account_id: account.id, gmail_history_id: null, status: "queued" }, { onConflict: "email_account_id" });
    if (sync.error) throw new Error("Could not initialize Gmail sync");
    const saved = await admin.from("email_accounts").update({ status: "connected" }).eq("id", account.id).eq("owner_id", viewer.id);
    if (saved.error) throw new Error("Could not finish Gmail connection");
    const response = NextResponse.redirect(new URL("/settings?gmail=connected#gmail", serverEnv.appUrl));
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch {
    // Only expose a known failure category, never provider responses or secrets.
    const response = NextResponse.redirect(new URL(`/settings?gmail=error&gmail_error=${failure}#gmail`, serverEnv.appUrl));
    response.cookies.delete("gmail_oauth_state");
    return response;
  }
}