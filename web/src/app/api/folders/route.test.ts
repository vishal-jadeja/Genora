import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const listFoldersMock = vi.fn();
const createFolderMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/folders/service", () => ({
  listFolders: (...args: unknown[]) => listFoldersMock(...args),
  createFolder: (...args: unknown[]) => createFolderMock(...args),
}));

const { GET, POST } = await import("./route");

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  listFoldersMock.mockReset();
  createFolderMock.mockReset();
});

describe("GET /api/folders", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns the user's folders", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    listFoldersMock.mockResolvedValue([{ id: "f1", name: "Ideas" }]);

    const response = await GET();
    const body = await response.json();

    expect(listFoldersMock).toHaveBeenCalledWith("user-1");
    expect(body).toEqual([{ id: "f1", name: "Ideas" }]);
  });
});

describe("POST /api/folders", () => {
  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost/api/folders", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createFolderMock).not.toHaveBeenCalled();
  });

  it("creates a folder", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    createFolderMock.mockResolvedValue({ id: "f1", name: "Ideas" });

    const response = await POST(
      new Request("http://localhost/api/folders", {
        method: "POST",
        body: JSON.stringify({ name: "Ideas" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createFolderMock).toHaveBeenCalledWith("user-1", "Ideas");
    expect(body).toEqual({ id: "f1", name: "Ideas" });
  });
});
