import "server-only";
import { requireViewer } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localDayKey, zonedDueAt } from "@/lib/time";
export async function getEmailMetrics(now = new Date()) {
  const viewer = await requireViewer();
  if (viewer.demo) return { sent: 0, opened: 0, replied: 0, today: 0, month: 0 };
  const supabase = await createSupabaseServerClient();
  const day = localDayKey(now);
  const dayStart = zonedDueAt(day, "00:00");
  const monthStart = zonedDueAt(`${day.slice(0, 7)}-01`, "00:00");
  const base = () => supabase.from("outbound_send_attempts").select("id", { count: "exact", head: true }).eq("owner_id", viewer.id).eq("status", "sent");
  // Count in the database, including removed trackers; never derive totals from a capped list.
  const results = await Promise.all([
    base(), base().not("first_opened_at", "is", null), base().not("replied_at", "is", null),
    base().gte("finished_at", dayStart).lte("finished_at", now.toISOString()),
    base().gte("finished_at", monthStart).lte("finished_at", now.toISOString())
  ]);
  if (results.some((result) => result.error)) throw new Error("Could not load email totals.");
  const [sent, opened, replied, today, month] = results.map((result) => result.count ?? 0);
  return { sent, opened, replied, today, month };
}
