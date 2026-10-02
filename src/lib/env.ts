import "server-only";
import { z } from "zod";

const optionalUrl = z.string().url().optional();

export const serverEnv = {
  appUrl: optionalUrl.parse(process.env.APP_URL) ?? "http://localhost:3000",
  trackingBaseUrl: optionalUrl.parse(process.env.TRACKING_BASE_URL),
  ownerEmail: z.string().email().optional().parse(process.env.OWNER_EMAIL)?.toLowerCase(),
  supabaseUrl: optionalUrl.parse(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  tokenEncryptionKey: process.env.OAUTH_TOKEN_ENCRYPTION_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: optionalUrl.parse(process.env.GOOGLE_REDIRECT_URI),
  openAiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-6-luna",
};

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const isSupabaseConfigured = Boolean(serverEnv.supabaseUrl && serverEnv.supabaseAnonKey && !serverEnv.supabaseUrl.includes("your-project"));

export function requireEnv<K extends keyof typeof serverEnv>(key: K): NonNullable<(typeof serverEnv)[K]> {
  const value = serverEnv[key];
  if (!value) throw new Error(`Missing required server environment variable for ${key}`);
  return value as NonNullable<(typeof serverEnv)[K]>;
}
