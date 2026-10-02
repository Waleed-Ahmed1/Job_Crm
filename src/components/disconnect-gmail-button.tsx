"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function DisconnectGmailButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function disconnect() {
    if (!confirm("Disconnect Gmail? Sending and synchronization will stop until you reconnect.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/gmail/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("Could not disconnect Gmail.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not disconnect Gmail."); }
    finally { setBusy(false); }
  }
  return <div><Button variant="outline" disabled={disabled || busy} onClick={disconnect}>Disconnect Gmail</Button>{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</div>;
}
