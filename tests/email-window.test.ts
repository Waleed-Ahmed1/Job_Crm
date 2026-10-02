import { describe, expect, it } from "vitest";
import { emailWindowStart, recentMailQuery } from "@/lib/email/window";
describe("recent email window", () => {
  it("uses the same rolling 72 hours for Gmail and stored conversations", () => {
    const now = new Date("2026-10-02T18:30:00Z");
    expect(emailWindowStart(now)).toBe("2026-09-29T18:30:00.000Z");
    expect(recentMailQuery(now)).toBe(`after:${Math.floor(new Date(emailWindowStart(now)).getTime() / 1000)} -in:spam -in:trash`);
  });
});
