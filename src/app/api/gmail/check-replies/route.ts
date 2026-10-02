import { requireApiViewer } from "@/lib/auth";
import { checkTrackedReplies } from "@/lib/email/check-replies";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const maxDuration = 120;
export async function POST() {
  try {
    const viewer = await requireApiViewer();
    const supabase = await createSupabaseServerClient();
    const { data: account, error } = await supabase.from("email_accounts").select("id,status").eq("owner_id", viewer.id).eq("provider", "gmail").maybeSingle();
    if (error) return Response.json({ error: "Could not load Gmail connection." }, { status: 500 });
    if (!account || account.status !== "connected") return Response.json({ error: "Gmail is not connected." }, { status: 409 });
    const result = await checkTrackedReplies(account.id, viewer.id);
    return Response.json(result, { status: result.checked < result.total ? 207 : 200 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not check replies. Check Gmail connection and database setup." }, { status: 502 });
  }
}
