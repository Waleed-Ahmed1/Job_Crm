import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await requireApiViewer(); const { id } = await context.params; const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return new Response("Not found", { status: 404 });
  const supabase = await createSupabaseServerClient(); const { data } = await supabase.from("resume_versions").select("resume_files(storage_path)").eq("id", parsed.data).eq("owner_id", viewer.id).single();
  const file = Array.isArray(data?.resume_files) ? data.resume_files[0] : data?.resume_files;
  if (!file) return new Response("Not found", { status: 404 });
  const signed = await supabase.storage.from("resumes").createSignedUrl(file.storage_path, 60);
  if (signed.error) return NextResponse.json({ error: "Could not create download link." }, { status: 500 });
  return NextResponse.redirect(signed.data.signedUrl);
}
