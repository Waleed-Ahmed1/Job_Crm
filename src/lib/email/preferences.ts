import "server-only";
import { requireViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const DEFAULT_TARGETS = { daily_target: 20, monthly_target: 400 };
export const WORKSPACE_SETUP_MESSAGE = "Apply supabase/migrations/0002_email_workspace.sql before deploying this update.";
export function isMissingWorkspaceSchema(error: { code?: string } | null): boolean {
  return Boolean(error && ["42P01", "42703", "PGRST204", "PGRST205"].includes(error.code ?? ""));
}
export async function getEmailPreferences() {
  const viewer = await requireViewer();
  if (viewer.demo) return { ...DEFAULT_TARGETS, setupRequired: false };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("email_preferences").select("daily_target,monthly_target").eq("owner_id", viewer.id).maybeSingle();
  if (error && !isMissingWorkspaceSchema(error)) throw new Error("Could not load email targets.");
  return { ...(data ?? DEFAULT_TARGETS), setupRequired: isMissingWorkspaceSchema(error) };
}
