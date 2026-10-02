import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ viewer: vi.fn(), client: vi.fn(), send: vi.fn(), account: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireApiViewer: mocks.viewer }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("@/inngest/client", () => ({ inngest: { send: mocks.send } }));
import { POST } from "@/app/api/gmail/sync/route";

describe("Gmail sync queue endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("INNGEST_DEV", "0");
    vi.stubEnv("INNGEST_EVENT_KEY", "test-event-key");
    vi.stubEnv("INNGEST_SIGNING_KEY", "test-signing-key");
    mocks.viewer.mockResolvedValue({ id: "owner-1", demo: false });
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: mocks.account };
    mocks.client.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });
    mocks.account.mockResolvedValue({ data: { id: "account-1", status: "connected" }, error: null });
    mocks.send.mockResolvedValue({ ids: ["event-1"] });
  });
  it("queues a connected account for the authorized owner", async () => {
    const response = await POST();
    expect(response.status).toBe(202);
    expect(mocks.send).toHaveBeenCalledWith({ name: "gmail/sync.requested", data: { accountId: "account-1", ownerId: "owner-1" } });
  });
  it("explains missing cloud configuration without submitting a job", async () => {
    vi.stubEnv("INNGEST_EVENT_KEY", "your-inngest-event-key");
    const response = await POST();
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("INNGEST_EVENT_KEY");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("returns a readable error without exposing provider secrets", async () => {
    mocks.send.mockRejectedValue(new Error("provider-secret-value"));
    const response = await POST();
    expect(response.status).toBe(502);
    const result = await response.json();
    expect(result.error).toContain("Could not queue");
    expect(result.error).not.toContain("provider-secret-value");
  });
  it("preserves unauthorized responses", async () => {
    mocks.viewer.mockRejectedValue(new Response("Unauthorized", { status: 401 }));
    const response = await POST();
    expect(response.status).toBe(401);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects a disconnected account", async () => {
    mocks.account.mockResolvedValue({ data: null, error: null });
    expect((await POST()).status).toBe(409);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("does not disguise database failures as disconnected Gmail", async () => {
    mocks.account.mockResolvedValue({ data: null, error: { code: "42501" } });
    expect((await POST()).status).toBe(500);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});