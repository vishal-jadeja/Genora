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

  it("passes folderId through from the query string", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    listPostsMock.mockResolvedValue([]);

    await GET(new Request("http://localhost/api/posts?folderId=f1"));

    expect(listPostsMock).toHaveBeenCalledWith("user-1", "f1");
  });
});

describe("POST /api/posts", () => {
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

  it("creates a draft post", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    createPostMock.mockResolvedValue({ id: "p1" });

    const response = await POST(
      new Request("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify({ rawContent: "a raw thought" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createPostMock).toHaveBeenCalledWith({
      userId: "user-1",
      rawContent: "a raw thought",
    });
  });
});
