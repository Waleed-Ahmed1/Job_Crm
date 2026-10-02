"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function EmailTargetForm({ daily, monthly, disabled }: { daily: number; monthly: number; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/settings/email", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ daily_target: Number(form.get("daily")), monthly_target: Number(form.get("monthly")) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save targets.");
      setMessage("Targets saved."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save targets."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="daily-target">Daily target</Label><Input id="daily-target" name="daily" type="number" min="0" max="100000" step="1" defaultValue={daily} required disabled={disabled || busy} /></div><div className="space-y-2"><Label htmlFor="monthly-target">Monthly target</Label><Input id="monthly-target" name="monthly" type="number" min="0" max="1000000" step="1" defaultValue={monthly} required disabled={disabled || busy} /></div></div><p className="text-sm text-muted-foreground">Targets track your progress; they do not change Gmail sending limits. Set 0 to leave a target unset. Days and months use Asia/Karachi time.</p><Button disabled={disabled || busy} type="submit">{busy ? "Saving..." : "Save targets"}</Button>{message ? <p role="status" className="text-sm">{message}</p> : null}</form>;
}
