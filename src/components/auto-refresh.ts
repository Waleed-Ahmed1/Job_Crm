"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches server data on an interval so new opens and replies appear without a manual reload. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}