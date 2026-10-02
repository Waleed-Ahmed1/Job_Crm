import "server-only";
import { google, gmail_v1 } from "googleapis";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/security/crypto";
import { requireEnv } from "@/lib/env";

export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"];
export function createGoogleOAuthClient() { return new google.auth.OAuth2(requireEnv("googleClientId"), requireEnv("googleClientSecret"), requireEnv("googleRedirectUri")); }
export async function oauthForAccount(accountId: string, expectedOwnerId: string) { const admin = createSupabaseAdminClient(); const { data, error } = await admin.rpc("get_oauth_credential", { p_account_id: accountId }); if (error || !data) throw new Error("Gmail credentials are unavailable"); const credential = data as { owner_id: string; encrypted_refresh_token: string }; if (credential.owner_id !== expectedOwnerId) throw new Error("Gmail account ownership mismatch"); const oauth = createGoogleOAuthClient(); oauth.setCredentials({ refresh_token: decryptSecret(credential.encrypted_refresh_token) }); return oauth; }
export async function gmailForAccount(accountId: string, expectedOwnerId: string): Promise<gmail_v1.Gmail> { return google.gmail({ version: "v1", auth: await oauthForAccount(accountId, expectedOwnerId) }); }
export function requestFingerprint(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
export function isAmbiguousSendError(error: unknown) { if (!(error instanceof Error)) return false; const code = (error as Error & { code?: string }).code; return ["ETIMEDOUT","ECONNRESET","EPIPE","UND_ERR_CONNECT_TIMEOUT"].includes(code ?? "") || /timeout|socket hang up/i.test(error.message); }
