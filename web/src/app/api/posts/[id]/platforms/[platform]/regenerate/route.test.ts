import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const regeneratePlatformMock = vi.fn();
const checkRateLimitMock = vi.fn();

class MockPostNotFoundError extends Error {}
class MockModelRequiredError extends Error {}

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/generation/generateService", () => ({
  regeneratePlatform: (...args: unknown[]) => regeneratePlatformMock(...args),
  ModelRequiredError: MockModelRequiredError,
}));

vi.mock("@/lib/posts/service", () => ({
  PostNotFoundError: MockPostNotFoundError,
}));

vi.mock("@/lib/redis/rateLimit", () => ({
  createRateLimiter: vi.fn(),
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
}));

const { POST } = await import("./route");

function ctx(id: string, platform: string) {
  return { params: Promise.resolve({ id, platform }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  regeneratePlatformMock.mockReset();
  checkRateLimitMock.mockReset();
  checkRateLimitMock.mockResolvedValue({
    allowed: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60_000,
  });
});

describe("POST /api/posts/[id]/platforms/[platform]/regenerate", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(401);
    expect(regeneratePlatformMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a platform not in the enum", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "not-a-real-platform"),
    );

    expect(response.status).toBe(400);
    expect(regeneratePlatformMock).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed JSON body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost", { method: "POST", body: "{not-json" }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for an unknown modelId", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ modelId: "made-up" }),
      }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(400);
    expect(regeneratePlatformMock).not.toHaveBeenCalled();
  });

  it("accepts an empty body (no modelId override)", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    regeneratePlatformMock.mockResolvedValue({
      runId: "run-1",
      publicAccessToken: "token",
    });

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin"),
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(regeneratePlatformMock).toHaveBeenCalledWith(
      "user-1",
      "post-1",
      "linkedin",
      undefined,
      expect.any(String),
    );
    expect(body).toEqual({ runId: "run-1", publicAccessToken: "token" });
  });

  it("passes an explicit modelId through", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    regeneratePlatformMock.mockResolvedValue({
      runId: "run-1",
      publicAccessToken: null,
    });

    await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ modelId: "sonnet" }),
      }),
      ctx("post-1", "linkedin"),
    );

    expect(regeneratePlatformMock).toHaveBeenCalledWith(
      "user-1",
      "post-1",
      "linkedin",
      "sonnet",
      expect.any(String),
    );
  });

  it("returns 404 when the post isn't found/owned", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    regeneratePlatformMock.mockRejectedValue(
      new MockPostNotFoundError("post-1"),
    );

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 when no modelId can be inferred", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    regeneratePlatformMock.mockRejectedValue(
      new MockModelRequiredError("no modelId given"),
    );

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(400);
  });

  it("returns 429 with Retry-After when the user is rate limited", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    checkRateLimitMock.mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30_000,
    });

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(regeneratePlatformMock).not.toHaveBeenCalled();
  });

  it("fails open (proceeds) when the rate limit check itself throws", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    checkRateLimitMock.mockRejectedValue(new Error("ECONNREFUSED"));
    regeneratePlatformMock.mockResolvedValue({
      runId: "run-1",
      publicAccessToken: "token",
    });

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(202);
    expect(regeneratePlatformMock).toHaveBeenCalled();
  });
});
