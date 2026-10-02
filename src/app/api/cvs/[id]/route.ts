import { z } from "zod";
import { cvSchema } from "@/lib/cv";
import { requireApiViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireApiViewer();
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return Response.json({ error: "Invalid CV." }, { status: 400 });
    const parsed = cvSchema.extend({ updated_at: z.iso.datetime({ offset: true }) }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { updated_at, ...content } = parsed.data;
    const { data, error } = await supabase.from("editable_cvs").update(content).eq("owner_id", viewer.id).eq("id", id).eq("updated_at", updated_at).select("id,title,body_text,updated_at").maybeSingle();
    if (error) return Response.json({ error: "Could not save CV." }, { status: 500 });
    if (!data) return Response.json({ error: "This CV changed in another tab or was deleted. Reload before saving; your edits are still here." }, { status: 409 });
    return Response.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not save CV." }, { status: 500 });
  }
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireApiViewer();
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return Response.json({ error: "Invalid CV." }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("editable_cvs").delete().eq("owner_id", viewer.id).eq("id", id);
    if (error) return Response.json({ error: "Could not delete CV." }, { status: 500 });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not delete CV." }, { status: 500 });
  }
}
