"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export function DeleteTrackerButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (!confirm("Delete this tracker and stop recording opens? The email stays in Gmail and still counts toward your targets.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/tracker/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not delete tracker.");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not delete tracker."); }
    finally { setBusy(false); }
  }
  return <div><Button variant="ghost" size="icon" aria-label="Delete tracker" title={disabled ? "Delivery must be resolved before deletion" : "Delete tracker"} disabled={disabled || busy} onClick={remove}><Trash2 className="size-4" /></Button>{error ? <p role="alert" className="max-w-48 text-xs text-destructive">{error}</p> : null}</div>;
}
