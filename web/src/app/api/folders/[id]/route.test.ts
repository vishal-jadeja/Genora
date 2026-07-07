import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const renameFolderMock = vi.fn();
const deleteFolderMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/folders/service", () => ({
  renameFolder: (...args: unknown[]) => renameFolderMock(...args),
  deleteFolder: (...args: unknown[]) => deleteFolderMock(...args),
}));

const { DELETE, PATCH } = await import("./route");

function ctxFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  renameFolderMock.mockReset();
  deleteFolderMock.mockReset();
});

describe("PATCH /api/folders/[id]", () => {
  it("returns 404 when the folder isn't owned by the user", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    renameFolderMock.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "New name" }),
      }),
      ctxFor("f1"),
    );

    expect(response.status).toBe(404);
  });

  it("renames the folder", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    renameFolderMock.mockResolvedValue({ id: "f1", name: "New name" });

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "New name" }),
      }),
      ctxFor("f1"),
    );
    const body = await response.json();

    expect(renameFolderMock).toHaveBeenCalledWith("user-1", "f1", "New name");
    expect(body).toEqual({ id: "f1", name: "New name" });
  });
});

describe("DELETE /api/folders/[id]", () => {
  it("returns 404 when nothing was deleted", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    deleteFolderMock.mockResolvedValue(false);

    const response = await DELETE(
      new Request("http://localhost"),
      ctxFor("f1"),
    );

    expect(response.status).toBe(404);
  });

  it("deletes the folder", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    deleteFolderMock.mockResolvedValue(true);

    const response = await DELETE(
      new Request("http://localhost"),
      ctxFor("f1"),
    );
    const body = await response.json();

    expect(body).toEqual({ ok: true });
  });
});
