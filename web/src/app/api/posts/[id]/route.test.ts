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
  PostNotFoundError: class PostNotFoundError extends Error {},
  FolderNotOwnedError: class FolderNotOwnedError extends Error {},
}));

const { GET, PATCH, DELETE } = await import("./route");

function ctx(id: string) {
  return { params: Promise.resolve({ id }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  getPostMock.mockReset();
  updatePostMock.mockReset();
  deletePostMock.mockReset();
});

describe("GET /api/posts/[id]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), ctx("p1"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when the post isn't found", async () => {
    const { PostNotFoundError } = await import("@/lib/posts/service");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getPostMock.mockRejectedValue(new PostNotFoundError("p1"));

    const response = await GET(new Request("http://localhost"), ctx("p1"));

    expect(response.status).toBe(404);
  });

  it("returns the post on success", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getPostMock.mockResolvedValue({ id: "p1", platformOutputs: [] });

    const response = await GET(new Request("http://localhost"), ctx("p1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ id: "p1", platformOutputs: [] });
  });
});

describe("PATCH /api/posts/[id]", () => {
  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
      ctx("p1"),
    );

    expect(response.status).toBe(400);
    expect(updatePostMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the post isn't found", async () => {
    const { PostNotFoundError } = await import("@/lib/posts/service");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    updatePostMock.mockRejectedValue(new PostNotFoundError("p1"));

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "New" }),
      }),
      ctx("p1"),
    );

    expect(response.status).toBe(404);
  });

  it("updates and returns the post", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    updatePostMock.mockResolvedValue({ id: "p1", title: "New" });

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "New" }),
      }),
      ctx("p1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updatePostMock).toHaveBeenCalledWith("user-1", "p1", {
      title: "New",
    });
    expect(body).toEqual({ id: "p1", title: "New" });
  });

  it("returns 400 when the folder isn't the user's", async () => {
    const { FolderNotOwnedError } = await import("@/lib/posts/service");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    updatePostMock.mockRejectedValue(new FolderNotOwnedError("folder-1"));

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ folderId: "folder-1" }),
      }),
      ctx("p1"),
    );

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/posts/[id]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost"), ctx("p1"));

    expect(response.status).toBe(401);
    expect(deletePostMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the post isn't found", async () => {
    const { PostNotFoundError } = await import("@/lib/posts/service");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    deletePostMock.mockRejectedValue(new PostNotFoundError("p1"));

    const response = await DELETE(new Request("http://localhost"), ctx("p1"));

    expect(response.status).toBe(404);
  });

  it("deletes the post", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    deletePostMock.mockResolvedValue(undefined);

    const response = await DELETE(new Request("http://localhost"), ctx("p1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });
});
