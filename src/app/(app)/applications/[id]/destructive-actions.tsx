"use client";
import { useState } from "react";
import { Archive, Trash2 } from "lucide-react";
import { archiveApplication, deleteApplication } from "@/app/(app)/applications/actions";
import { Button } from "@/components/ui/button";
export function DestructiveActions({ id, disabled }: { id: string; disabled?: boolean }) { const [confirming, setConfirming] = useState<"archive" | "delete" | null>(null); if (confirming) return <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm"><span>Confirm {confirming}?</span><Button size="sm" variant="destructive" onClick={() => void (confirming === "archive" ? archiveApplication(id) : deleteApplication(id))}>Confirm</Button><Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button></div>; return <div className="flex gap-2"><Button disabled={disabled} variant="outline" onClick={() => setConfirming("archive")}><Archive />Archive</Button><Button disabled={disabled} variant="outline" className="text-destructive" onClick={() => setConfirming("delete")}><Trash2 />Delete</Button></div>; }
