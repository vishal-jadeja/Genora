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
  FolderNameTakenError: class FolderNameTakenError extends Error {},
  FolderNotFoundError: class FolderNotFoundError extends Error {},
}));

const { PATCH, DELETE } = await import("./route");

function ctx(id: string) {
  return { params: Promise.resolve({ id }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  renameFolderMock.mockReset();
  deleteFolderMock.mockReset();
});

describe("PATCH /api/folders/[id]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "New" }),
      }),
      ctx("f1"),
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "" }),
      }),
      ctx("f1"),
    );

    expect(response.status).toBe(400);
    expect(renameFolderMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the folder isn't found", async () => {
    const { FolderNotFoundError } = await import("@/lib/folders/service");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    renameFolderMock.mockRejectedValue(new FolderNotFoundError("f1"));

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "New" }),
      }),
      ctx("f1"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 409 on a duplicate name", async () => {
    const { FolderNameTakenError } = await import("@/lib/folders/service");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    renameFolderMock.mockRejectedValue(new FolderNameTakenError("New"));

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "New" }),
      }),
      ctx("f1"),
    );

    expect(response.status).toBe(409);
  });

  it("renames and returns the folder on success", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    renameFolderMock.mockResolvedValue({ id: "f1", name: "New" });

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "New" }),
      }),
      ctx("f1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(renameFolderMock).toHaveBeenCalledWith("user-1", "f1", "New");
    expect(body).toEqual({ id: "f1", name: "New" });
  });
});

describe("DELETE /api/folders/[id]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost"), ctx("f1"));

    expect(response.status).toBe(401);
    expect(deleteFolderMock).not.toHaveBeenCalled();
  });

  it("deletes the folder", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    deleteFolderMock.mockResolvedValue(undefined);

    const response = await DELETE(new Request("http://localhost"), ctx("f1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(deleteFolderMock).toHaveBeenCalledWith("user-1", "f1");
  });
});
