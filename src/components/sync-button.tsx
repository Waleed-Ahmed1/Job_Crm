"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
export function SyncButton({ disabled }: { disabled?: boolean }) { const [status, setStatus] = useState(""); async function sync() { setStatus("Queueing…"); const response = await fetch("/api/gmail/sync", { method: "POST" }); setStatus(response.ok ? "Sync queued" : "Could not queue sync"); } return <div className="flex items-center gap-2"><Button variant="outline" disabled={disabled || status === "Queueing…"} onClick={sync}><RefreshCw />Sync now</Button>{status ? <span role="status" className="text-xs text-muted-foreground">{status}</span> : null}</div>; }
