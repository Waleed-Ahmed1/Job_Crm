"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applicationSchema } from "@/lib/validation";

export type ApplicationActionState = { error?: string };
export async function createApplication(_: ApplicationActionState, formData: FormData): Promise<ApplicationActionState> {
  const viewer = await requireViewer();
  if (viewer.demo) return { error: "Sample mode is read-only. Configure Supabase to save applications." };
  const raw = Object.fromEntries(formData);
  const parsed = applicationSchema.safeParse({ ...raw, workArrangement: raw.workArrangement || undefined, appliedAt: raw.appliedAt || undefined, salaryMin: raw.salaryMin || undefined, salaryMax: raw.salaryMax || undefined, currency: raw.currency || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const supabase = await createSupabaseServerClient();
  const companyResult = await supabase.from("companies").upsert({ owner_id: viewer.id, name: parsed.data.company }, { onConflict: "owner_id,name" }).select("id").single();
  if (companyResult.error) return { error: "Could not save the company." };
  const { data, error } = await supabase.from("applications").insert({ owner_id: viewer.id, company_id: companyResult.data.id, role_title: parsed.data.role, stage: parsed.data.stage, job_url: parsed.data.jobUrl || null, location: parsed.data.location || null, work_arrangement: parsed.data.workArrangement || null, source: parsed.data.source || null, priority: parsed.data.priority, description: parsed.data.description || null, notes: parsed.data.notes || null, applied_at: parsed.data.appliedAt ? new Date(`${parsed.data.appliedAt}T00:00:00`).toISOString() : null, salary_min: parsed.data.salaryMin ?? null, salary_max: parsed.data.salaryMax ?? null, salary_currency: parsed.data.currency?.toUpperCase() ?? null }).select("id").single();
  if (error) return { error: "Could not save the application." };
  revalidatePath("/dashboard"); revalidatePath("/applications");
  redirect(`/applications/${data.id}`);
}

const idSchema = z.uuid();
export async function archiveApplication(id: string) {
  const viewer = await requireViewer(); if (viewer.demo) return;
  const parsed = idSchema.parse(id); const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("applications").update({ archived_at: new Date().toISOString() }).eq("id", parsed).eq("owner_id", viewer.id);
  if (error) throw new Error("Could not archive application"); revalidatePath("/applications"); redirect("/applications");
}

export async function deleteApplication(id: string) {
  const viewer = await requireViewer(); if (viewer.demo) return;
  const parsed = idSchema.parse(id); const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("applications").delete().eq("id", parsed).eq("owner_id", viewer.id);
  if (error) throw new Error("Could not delete application"); revalidatePath("/applications"); redirect("/applications");
}
