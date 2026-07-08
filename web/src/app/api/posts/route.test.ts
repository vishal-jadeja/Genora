import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const listPostsMock = vi.fn();
const createPostMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/posts/service", () => ({
  listPosts: (...args: unknown[]) => listPostsMock(...args),
  createPost: (...args: unknown[]) => createPostMock(...args),
  FolderNotOwnedError: class FolderNotOwnedError extends Error {},
}));

const { GET, POST } = await import("./route");

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  listPostsMock.mockReset();
  createPostMock.mockReset();
});

describe("GET /api/posts", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/posts"));

    expect(response.status).toBe(401);
  });

  it("passes the folderId query param through", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    listPostsMock.mockResolvedValue([]);

    await GET(new Request("http://localhost/api/posts?folderId=f1"));

    expect(listPostsMock).toHaveBeenCalledWith("user-1", "f1");
  });

  it("returns the user's posts", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    listPostsMock.mockResolvedValue([{ id: "p1" }]);

    const response = await GET(new Request("http://localhost/api/posts"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listPostsMock).toHaveBeenCalledWith("user-1", undefined);
    expect(body).toEqual([{ id: "p1" }]);
  });
});

describe("POST /api/posts", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ rawContent: "hello" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ rawContent: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("creates the post and returns 201", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    createPostMock.mockResolvedValue({ id: "p1", rawContent: "hello" });

    const response = await POST(
      new Request("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ rawContent: "hello" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ id: "p1", rawContent: "hello" });
  });

  it("returns 400 when the folder isn't the user's", async () => {
    const { FolderNotOwnedError } = await import("@/lib/posts/service");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    createPostMock.mockRejectedValue(new FolderNotOwnedError("folder-1"));

    const response = await POST(
      new Request("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ rawContent: "hello", folderId: "folder-1" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
