import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ viewer: vi.fn(), client: vi.fn(), single: vi.fn(), query: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/lib/auth", () => ({ requireApiViewer: mocks.viewer, requireViewer: mocks.viewer }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
import { DELETE as deleteTracker } from "@/app/api/tracker/[id]/route";
import { PUT as saveCv } from "@/app/api/cvs/[id]/route";
import { PUT as saveTargets } from "@/app/api/settings/email/route";
import { getEmailMetrics } from "@/lib/email/metrics";
const id = "9b4b7f3c-2711-4ec4-80ca-9485b8600692";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.viewer.mockResolvedValue({ id: "owner-1", demo: false });
  mocks.query = {};
  for (const method of ["select", "update", "eq", "in", "is", "gte", "lte", "not", "upsert"]) mocks.query[method] = vi.fn().mockImplementation(() => mocks.query);
  mocks.query.maybeSingle = mocks.single;
  mocks.single.mockResolvedValue({ data: { id }, error: null });
  mocks.client.mockResolvedValue({ from: vi.fn().mockReturnValue(mocks.query) });
});
describe("tracker deletion safety", () => {
  it("archives only the owner's resolved sends without deleting idempotency records", async () => {
    const response = await deleteTracker(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(mocks.query.update).toHaveBeenCalledWith({ archived_at: expect.any(String) });
    expect(mocks.query.eq).toHaveBeenCalledWith("owner_id", "owner-1");
    expect(mocks.query.in).toHaveBeenCalledWith("status", ["sent", "failed"]);
    expect(mocks.query.is).toHaveBeenCalledWith("archived_at", null);
  });
  it("refuses unresolved sends and preserves authorization failures", async () => {
    mocks.single.mockResolvedValue({ data: null, error: null });
    expect((await deleteTracker(new Request("http://localhost"), { params: Promise.resolve({ id }) })).status).toBe(409);
    mocks.viewer.mockRejectedValue(new Response("Unauthorized", { status: 401 }));
    expect((await deleteTracker(new Request("http://localhost"), { params: Promise.resolve({ id }) })).status).toBe(401);
  });
  it("explains a missing migration without a server crash", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { code: "42703" } });
    const response = await deleteTracker(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("0002_email_workspace.sql");
  });
});
describe("CV updates", () => {
  it("accepts Supabase timestamps and protects edits made in another tab", async () => {
    const request = new Request("http://localhost", { method: "PUT", body: JSON.stringify({ title: "General CV", body_text: "Jane\nEXPERIENCE", updated_at: "2026-10-02T10:00:00+00:00" }) });
    const response = await saveCv(request, { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(mocks.query.eq).toHaveBeenCalledWith("owner_id", "owner-1");
    expect(mocks.query.eq).toHaveBeenCalledWith("updated_at", "2026-10-02T10:00:00+00:00");
  });
  it("reports conflicts rather than overwriting a newer CV", async () => {
    mocks.single.mockResolvedValue({ data: null, error: null });
    const response = await saveCv(new Request("http://localhost", { method: "PUT", body: JSON.stringify({ title: "CV", body_text: "Name", updated_at: "2026-10-02T10:00:00Z" }) }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(409);
  });
});
describe("targets and metrics", () => {
  it("rejects negative and fractional goals before touching the database", async () => {
    const response = await saveTargets(new Request("http://localhost", { method: "PUT", body: JSON.stringify({ daily_target: -1, monthly_target: 2.5 }) }));
    expect(response.status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("counts all sent emails with Karachi boundaries, including archived trackers", async () => {
    let sequence = 0;
    const queries: Record<string, ReturnType<typeof vi.fn>>[] = [];
    mocks.client.mockResolvedValue({ from: vi.fn().mockImplementation(() => {
      const count = [250, 100, 25, 2, 12][sequence++];
      const query: Record<string, ReturnType<typeof vi.fn>> = {};
      for (const method of ["select", "eq", "not", "gte", "lte"]) query[method] = vi.fn().mockImplementation(() => query);
      query.then = vi.fn().mockImplementation((resolve) => Promise.resolve({ count, error: null }).then(resolve));
      queries.push(query); return query;
    }) });
    const metrics = await getEmailMetrics(new Date("2026-10-01T00:30:00+05:00"));
    expect(metrics).toEqual({ sent: 250, opened: 100, replied: 25, today: 2, month: 12 });
    expect(queries[3].gte).toHaveBeenCalledWith("finished_at", "2026-09-30T19:00:00.000Z");
    expect(queries[4].gte).toHaveBeenCalledWith("finished_at", "2026-09-30T19:00:00.000Z");
    queries.forEach((query) => expect(query.eq).toHaveBeenCalledWith("status", "sent"));
    expect(queries[0].select).toHaveBeenCalledWith("id", { count: "exact", head: true });
  });
});
