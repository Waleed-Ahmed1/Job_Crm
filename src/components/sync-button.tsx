"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncButton({ disabled }: { disabled?: boolean }) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  async function sync() {
    setPending(true);
    setStatus("Queueing…");
    try {
      const response = await fetch("/api/gmail/sync", { method: "POST" });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      setStatus(response.ok ? "Sync queued" : result?.error ?? `Could not queue sync (HTTP ${response.status}).`);
    } catch {
      setStatus("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }
  return <div className="flex items-center gap-2"><Button variant="outline" disabled={disabled || pending} onClick={sync}><RefreshCw />Sync now</Button>{status ? <span role="status" className="max-w-sm text-xs text-muted-foreground">{status}</span> : null}</div>;
}