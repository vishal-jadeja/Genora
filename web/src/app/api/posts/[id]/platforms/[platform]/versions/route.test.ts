import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const listPlatformOutputVersionsMock = vi.fn();

class MockPostNotFoundError extends Error {}

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/posts/service", () => ({
  listPlatformOutputVersions: (...args: unknown[]) =>
    listPlatformOutputVersionsMock(...args),
  PostNotFoundError: MockPostNotFoundError,
}));

const { GET } = await import("./route");

function ctx(id: string, platform: string) {
  return { params: Promise.resolve({ id, platform }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  listPlatformOutputVersionsMock.mockReset();
});

describe("GET /api/posts/[id]/platforms/[platform]/versions", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost"),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for a platform not in the enum", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await GET(
      new Request("http://localhost"),
      ctx("post-1", "not-a-real-platform"),
    );

    expect(response.status).toBe(400);
    expect(listPlatformOutputVersionsMock).not.toHaveBeenCalled();
  });

  it("returns the versions list", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    listPlatformOutputVersionsMock.mockResolvedValue([
      { version: 2 },
      { version: 1 },
    ]);

    const response = await GET(
      new Request("http://localhost"),
      ctx("post-1", "linkedin"),
    );
    const body = await response.json();

    expect(listPlatformOutputVersionsMock).toHaveBeenCalledWith(
      "user-1",
      "post-1",
      "linkedin",
    );
    expect(response.status).toBe(200);
    expect(body).toEqual([{ version: 2 }, { version: 1 }]);
  });

  it("returns 404 when the post isn't found/owned", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    listPlatformOutputVersionsMock.mockRejectedValue(
      new MockPostNotFoundError("post-1"),
    );

    const response = await GET(
      new Request("http://localhost"),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(404);
  });
});
