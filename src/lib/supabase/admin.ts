import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  return createClient(requireEnv("supabaseUrl"), requireEnv("serviceRoleKey"), { auth: { persistSession: false, autoRefreshToken: false } });
}
