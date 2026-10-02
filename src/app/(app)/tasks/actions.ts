"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { zonedDueAt } from "@/lib/time";

export type TaskActionState = { error?: string };
const formSchema = z.object({ title: z.string().trim().min(1).max(240), date: z.iso.date(), time: z.string().regex(/^\d{2}:\d{2}$/), kind: z.enum(["follow_up", "interview_prep", "general"]), applicationId: z.string().optional() });
export async function createTask(_: TaskActionState, formData: FormData): Promise<TaskActionState> { const viewer = await requireViewer(); if (viewer.demo) return { error: "Sample mode is read-only." }; const parsed = formSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Check the title and due date." }; const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("tasks").insert({ owner_id: viewer.id, title: parsed.data.title, due_at: zonedDueAt(parsed.data.date, parsed.data.time), kind: parsed.data.kind, application_id: parsed.data.applicationId || null }); if (error) return { error: "Could not save the task." }; revalidatePath("/tasks"); revalidatePath("/dashboard"); redirect("/tasks"); }
export async function completeTask(id: string) { const viewer = await requireViewer(); if (viewer.demo) return; const parsed = z.uuid().parse(id); const supabase = await createSupabaseServerClient(); const { error } = await supabase.from("tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", parsed).eq("owner_id", viewer.id); if (error) throw new Error("Could not complete task"); revalidatePath("/tasks"); revalidatePath("/dashboard"); }
