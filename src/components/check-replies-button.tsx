"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CheckRepliesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  async function check() {
    setBusy(true);
    setStatus("Checking Gmail…");
    try {
      const response = await fetch("/api/gmail/check-replies", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { checked?: number; total?: number; error?: string };
      setStatus(response.ok ? `Checked ${data.checked ?? 0} of ${data.total ?? 0} conversations.` : (data.error ?? "Check failed"));
      router.refresh();
    } catch {
      setStatus("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" disabled={busy} onClick={check}><RefreshCw />Check replies</Button>
      {status ? <span role="status" className="text-xs text-muted-foreground">{status}</span> : null}
    </div>
  );
}