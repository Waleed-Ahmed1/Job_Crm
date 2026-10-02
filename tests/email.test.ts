import { describe, expect, it } from "vitest";
import { composeMime } from "@/lib/email/mime";
import { sanitizeEmailHtml } from "@/lib/email/sanitize";
import { isAmbiguousSendError, requestFingerprint } from "@/lib/email/gmail";

describe("email safety and threading", () => {
  it("builds reply headers into valid MIME", async () => { const raw = await composeMime({ from: "me@example.com", to: ["recruiter@example.com"], subject: "Re: Interview", bodyText: "Thank you.", inReplyTo: "<original@example.com>", references: ["<first@example.com>", "<original@example.com>"] }); const mime = Buffer.from(raw, "base64url").toString("utf8"); expect(mime).toContain("In-Reply-To: <original@example.com>"); expect(mime).toMatch(/References: <first@example.com>[\s\S]*<original@example.com>/); expect(mime).toContain("Subject: Re: Interview"); });
  it("removes scripts, handlers, and remote images", () => { const clean = sanitizeEmailHtml('<p onclick="steal()">Hello</p><script>alert(1)</script><img src="https://tracker.invalid/pixel"><a href="javascript:bad()">bad</a>'); expect(clean).toContain("Hello"); expect(clean).not.toMatch(/script|onclick|img|javascript/i); });
  it("detects ambiguous transport failures but not provider rejections", () => { const timeout = Object.assign(new Error("socket timeout"), { code: "ETIMEDOUT" }); expect(isAmbiguousSendError(timeout)).toBe(true); expect(isAmbiguousSendError(new Error("invalid recipient"))).toBe(false); });
  it("makes stable request fingerprints", () => { expect(requestFingerprint({ to: ["a@example.com"], body: "hi" })).toBe(requestFingerprint({ to: ["a@example.com"], body: "hi" })); expect(requestFingerprint({ body: "one" })).not.toBe(requestFingerprint({ body: "two" })); });
});
