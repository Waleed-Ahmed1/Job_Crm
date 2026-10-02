import { cvSchema } from "@/lib/cv";
import { requireApiViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingWorkspaceSchema, WORKSPACE_SETUP_MESSAGE } from "@/lib/email/preferences";
export async function GET() {
  try {
    const viewer = await requireApiViewer();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("editable_cvs").select("id,title,body_text,updated_at").eq("owner_id", viewer.id).order("updated_at", { ascending: false }).limit(100);
    if (error) return Response.json({ error: isMissingWorkspaceSchema(error) ? WORKSPACE_SETUP_MESSAGE : "Could not load CVs." }, { status: 503 });
    return Response.json(data, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not load CVs." }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const viewer = await requireApiViewer();
    const parsed = cvSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("editable_cvs").insert({ owner_id: viewer.id, ...parsed.data }).select("id,title,body_text,updated_at").single();
    if (error) return Response.json({ error: isMissingWorkspaceSchema(error) ? WORKSPACE_SETUP_MESSAGE : "Could not save CV." }, { status: 503 });
    return Response.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Could not save CV." }, { status: 500 });
  }
}
