import { z } from "zod";
import { requireApiViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingWorkspaceSchema, WORKSPACE_SETUP_MESSAGE } from "@/lib/email/preferences";
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireApiViewer();
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return Response.json({ error: "Invalid tracker." }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    // Preserve idempotency keys, delivery history, and dashboard counts.
    // Do not remove unresolved sends while delivery may still be in progress.
    const { data, error } = await supabase.from("outbound_send_attempts")
      .update({ archived_at: new Date().toISOString() }).eq("owner_id", viewer.id).eq("id", id)
      .in("status", ["sent", "failed"]).is("archived_at", null).select("id").maybeSingle();
    if (error) return Response.json({ error: isMissingWorkspaceSchema(error) ? WORKSPACE_SETUP_MESSAGE : "Could not delete tracker." }, { status: 503 });
    if (!data) return Response.json({ error: "Tracker not found, already deleted, or delivery is still unresolved." }, { status: 409 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not delete tracker." }, { status: 500 });
  }
}
