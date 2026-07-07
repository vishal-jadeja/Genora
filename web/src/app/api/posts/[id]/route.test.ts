import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const getPostMock = vi.fn();
const updatePostMock = vi.fn();
const deletePostMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/posts/service", () => ({
  getPost: (...args: unknown[]) => getPostMock(...args),
  updatePost: (...args: unknown[]) => updatePostMock(...args),
  deletePost: (...args: unknown[]) => deletePostMock(...args),
}));

const { DELETE, GET, PATCH } = await import("./route");

function ctxFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  getPostMock.mockReset();
  updatePostMock.mockReset();
  deletePostMock.mockReset();
});

describe("GET /api/posts/[id]", () => {
  it("returns 404 when the post isn't owned by the user", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getPostMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), ctxFor("p1"));

    expect(response.status).toBe(404);
  });

  it("returns the post", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getPostMock.mockResolvedValue({ id: "p1" });

    const response = await GET(new Request("http://localhost"), ctxFor("p1"));
    const body = await response.json();

    expect(body).toEqual({ id: "p1" });
  });
});

describe("PATCH /api/posts/[id]", () => {
  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ status: "not-a-status" }),
      }),
      ctxFor("p1"),
    );

    expect(response.status).toBe(400);
    expect(updatePostMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the post isn't owned by the user", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    updatePostMock.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "New title" }),
      }),
      ctxFor("p1"),
    );

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/posts/[id]", () => {
  it("returns 404 when nothing was deleted", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    deletePostMock.mockResolvedValue(false);

    const response = await DELETE(
      new Request("http://localhost"),
      ctxFor("p1"),
    );

    expect(response.status).toBe(404);
  });
});
