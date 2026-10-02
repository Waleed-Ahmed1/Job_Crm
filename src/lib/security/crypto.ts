import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env";

function key() { const decoded = Buffer.from(requireEnv("tokenEncryptionKey"), "base64"); if (decoded.length !== 32) throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64"); return decoded; }
export function encryptSecret(plaintext: string) { const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv); const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]); return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join("."); }
export function decryptSecret(payload: string) { const [version, iv, tag, encrypted] = payload.split("."); if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Unsupported encrypted secret"); const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url")); decipher.setAuthTag(Buffer.from(tag, "base64url")); return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8"); }
export function secureEqual(left: string, right: string) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
