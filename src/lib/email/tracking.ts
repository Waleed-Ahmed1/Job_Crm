import "server-only";
import { randomBytes } from "node:crypto";
import { serverEnv } from "@/lib/env";

/** Public origin the recipient's mail client can reach, or null when tracking is not possible (localhost / plain http). */
export function trackingOrigin(): string | null {
  try {
    const url = new URL(serverEnv.trackingBaseUrl ?? serverEnv.appUrl);
    const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
    return url.protocol === "https:" && !local ? url.origin : null;
  } catch {
    return null;
  }
}

export function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

/** Builds the HTML alternative with a 1x1 tracking image. Returns no token/html when tracking is unavailable. */
export function prepareTracking(bodyText: string): { token: string | null; html: string | undefined } {
  const origin = trackingOrigin();
  if (!origin) return { token: null, html: undefined };
  const token = randomBytes(24).toString("base64url");
  const html =
    `<div style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(bodyText)}</div>` +
    `<img src="${origin}/api/track/open/${token}" width="1" height="1" alt="" style="border:0">`;
  return { token, html };
}