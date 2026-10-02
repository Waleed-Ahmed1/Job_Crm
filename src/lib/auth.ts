import "server-only";
import { redirect } from "next/navigation";
import { isDemoMode, isSupabaseConfigured, serverEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Viewer = { id: string; email: string; demo: boolean };

export async function getViewer(): Promise<Viewer | null> {
  if (isDemoMode) return { id: "00000000-0000-0000-0000-000000000001", email: "demo@northstar.local", demo: true };
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;
  if (!serverEnv.ownerEmail || user.email.toLowerCase() !== serverEnv.ownerEmail) return null;
  return { id: user.id, email: user.email, demo: false };
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireApiViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) throw new Response("Unauthorized", { status: 401 });
  return viewer;
}
