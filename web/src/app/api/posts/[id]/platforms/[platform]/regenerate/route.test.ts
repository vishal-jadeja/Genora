import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const regeneratePlatformMock = vi.fn();

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

const { POST } = await import("./route");

function ctx(id: string, platform: string) {
  return { params: Promise.resolve({ id, platform }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  regeneratePlatformMock.mockReset();
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
});
