import { beforeAll, describe, expect, it } from "vitest";

describe("server secret encryption", () => {
  beforeAll(() => { process.env.OAUTH_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); });
  it("round-trips without storing plaintext", async () => { const { decryptSecret, encryptSecret } = await import("@/lib/security/crypto"); const encrypted = encryptSecret("refresh-token-value"); expect(encrypted).not.toContain("refresh-token-value"); expect(decryptSecret(encrypted)).toBe("refresh-token-value"); });
  it("uses constant-time equality semantics", async () => { const { secureEqual } = await import("@/lib/security/crypto"); expect(secureEqual("state-value", "state-value")).toBe(true); expect(secureEqual("state-value", "other-value")).toBe(false); expect(secureEqual("short", "much-longer")).toBe(false); });
});
