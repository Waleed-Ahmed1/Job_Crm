import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiViewer } from "@/lib/auth";
import { createGoogleOAuthClient, GMAIL_SCOPES } from "@/lib/email/gmail";

export async function GET() { const viewer = await requireApiViewer(); const state = randomBytes(32).toString("base64url"); const oauth = createGoogleOAuthClient(); const url = oauth.generateAuthUrl({ access_type: "offline", include_granted_scopes: true, prompt: "consent select_account", scope: GMAIL_SCOPES, state, login_hint: viewer.email }); const response = NextResponse.redirect(url); response.cookies.set("gmail_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/api/gmail/oauth" }); return response; }
