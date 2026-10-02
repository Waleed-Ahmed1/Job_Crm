"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, serverEnv } from "@/lib/env";

export type LoginState = { error?: string };
const schema = z.object({ email: z.email(), password: z.string().min(8) });

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured. Add the values from .env.example." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  if (!serverEnv.ownerEmail || parsed.data.email.toLowerCase() !== serverEnv.ownerEmail) return { error: "This account is not authorized." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Sign-in failed. Check your credentials." };
  redirect("/dashboard");
}

export async function logout() {
  if (isSupabaseConfigured) { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut(); }
  redirect("/login");
}
