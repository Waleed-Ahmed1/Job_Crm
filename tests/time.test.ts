import { describe, expect, it } from "vitest";
import { dueBucket, localDayKey, zonedDueAt } from "@/lib/time";
describe("timezone-aware reminders", () => {
  it("uses Asia/Karachi day boundaries", () => { const now = new Date("2026-09-30T20:30:00Z"); expect(localDayKey(now)).toBe("2026-10-01"); expect(dueBucket("2026-09-30T19:30:00Z", now)).toBe("today"); expect(dueBucket("2026-09-30T18:00:00Z", now)).toBe("overdue"); expect(dueBucket("2026-10-01T19:00:00Z", now)).toBe("upcoming"); });
  it("converts a local due time to UTC", () => { expect(zonedDueAt("2026-10-01", "09:00")).toBe("2026-10-01T04:00:00.000Z"); });
});
