import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const editPlatformOutputContentMock = vi.fn();

class MockPostNotFoundError extends Error {}
class MockPlatformOutputNotFoundError extends Error {}

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/posts/service", () => ({
  editPlatformOutputContent: (...args: unknown[]) =>
    editPlatformOutputContentMock(...args),
  PostNotFoundError: MockPostNotFoundError,
  PlatformOutputNotFoundError: MockPlatformOutputNotFoundError,
}));

const { PATCH } = await import("./route");

function ctx(id: string, platform: string) {
  return { params: Promise.resolve({ id, platform }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  editPlatformOutputContentMock.mockReset();
});

describe("PATCH /api/posts/[id]/platforms/[platform]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ content: "edited" }),
      }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for a platform not in the enum", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ content: "edited" }),
      }),
      ctx("post-1", "not-a-real-platform"),
    );

    expect(response.status).toBe(400);
    expect(editPlatformOutputContentMock).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed JSON", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: "{not-json" }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 on empty content", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ content: "" }),
      }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(400);
    expect(editPlatformOutputContentMock).not.toHaveBeenCalled();
  });

  it("edits and returns the updated output", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    editPlatformOutputContentMock.mockResolvedValue({
      id: "output-2",
      platform: "linkedin",
      content: "edited",
      version: 3,
    });

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ content: "edited" }),
      }),
      ctx("post-1", "linkedin"),
    );
    const body = await response.json();

    expect(editPlatformOutputContentMock).toHaveBeenCalledWith(
      "user-1",
      "post-1",
      "linkedin",
      "edited",
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: "output-2",
      platform: "linkedin",
      content: "edited",
      version: 3,
    });
  });

  it("returns 404 when the post isn't found/owned", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    editPlatformOutputContentMock.mockRejectedValue(
      new MockPostNotFoundError("post-1"),
    );

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ content: "edited" }),
      }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when the platform has no generated content yet", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    editPlatformOutputContentMock.mockRejectedValue(
      new MockPlatformOutputNotFoundError("post-1:linkedin"),
    );

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ content: "edited" }),
      }),
      ctx("post-1", "linkedin"),
    );

    expect(response.status).toBe(404);
  });
});
