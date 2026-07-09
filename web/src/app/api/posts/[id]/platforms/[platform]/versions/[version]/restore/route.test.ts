import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const restorePlatformOutputVersionMock = vi.fn();

class MockPostNotFoundError extends Error {}
class MockVersionNotFoundError extends Error {}

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/posts/service", () => ({
  restorePlatformOutputVersion: (...args: unknown[]) =>
    restorePlatformOutputVersionMock(...args),
  PostNotFoundError: MockPostNotFoundError,
  VersionNotFoundError: MockVersionNotFoundError,
}));

const { POST } = await import("./route");

function ctx(id: string, platform: string, version: string) {
  return { params: Promise.resolve({ id, platform, version }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  restorePlatformOutputVersionMock.mockReset();
});

describe("POST /api/posts/[id]/platforms/[platform]/versions/[version]/restore", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin", "2"),
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for a platform not in the enum", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "not-a-real-platform", "2"),
    );

    expect(response.status).toBe(400);
    expect(restorePlatformOutputVersionMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-integer version", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin", "not-a-number"),
    );

    expect(response.status).toBe(400);
    expect(restorePlatformOutputVersionMock).not.toHaveBeenCalled();
  });

  it("returns 400 for version zero or negative", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin", "0"),
    );

    expect(response.status).toBe(400);
  });

  it("restores the version and returns the now-current row", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    restorePlatformOutputVersionMock.mockResolvedValue({
      id: "output-1",
      version: 2,
      isCurrent: true,
    });

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin", "2"),
    );
    const body = await response.json();

    expect(restorePlatformOutputVersionMock).toHaveBeenCalledWith(
      "user-1",
      "post-1",
      "linkedin",
      2,
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({ id: "output-1", version: 2, isCurrent: true });
  });

  it("returns 404 when the post isn't found/owned", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    restorePlatformOutputVersionMock.mockRejectedValue(
      new MockPostNotFoundError("post-1"),
    );

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin", "2"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when the version doesn't exist", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    restorePlatformOutputVersionMock.mockRejectedValue(
      new MockVersionNotFoundError("post-1:linkedin:99"),
    );

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
      ctx("post-1", "linkedin", "99"),
    );

    expect(response.status).toBe(404);
  });
});
