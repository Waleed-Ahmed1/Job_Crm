import { z } from "zod";
import { requireApiViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingWorkspaceSchema, WORKSPACE_SETUP_MESSAGE } from "@/lib/email/preferences";
const schema = z.object({ daily_target: z.number().int().min(0).max(100000), monthly_target: z.number().int().min(0).max(1000000) });
export async function PUT(request: Request) {
  try {
    const viewer = await requireApiViewer();
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Enter valid whole-number daily and monthly targets." }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("email_preferences").upsert({ owner_id: viewer.id, ...parsed.data });
    if (error) return Response.json({ error: isMissingWorkspaceSchema(error) ? WORKSPACE_SETUP_MESSAGE : "Could not save targets." }, { status: 503 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not save targets." }, { status: 500 });
  }
}
