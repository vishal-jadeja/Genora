import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/db/client", () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
    insert: (...args: unknown[]) => insertMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

const {
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  FolderNameTakenError,
  FolderNotFoundError,
} = await import("./service");

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
});

describe("listFolders", () => {
  it("scopes the query to the given user", async () => {
    const where = vi.fn().mockResolvedValue([{ id: "f1", name: "Ideas" }]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await listFolders("user-1");

    expect(result).toEqual([{ id: "f1", name: "Ideas" }]);
    expect(from).toHaveBeenCalled();
  });
});

describe("createFolder", () => {
  it("inserts and returns the new folder", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "f1", name: "New" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });

    const result = await createFolder("user-1", "New");

    expect(values).toHaveBeenCalledWith({ userId: "user-1", name: "New" });
    expect(result).toEqual({ id: "f1", name: "New" });
  });

  it("throws FolderNameTakenError on a unique constraint violation", async () => {
    const returning = vi.fn().mockRejectedValue({ code: "23505" });
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });

    await expect(createFolder("user-1", "Dup")).rejects.toThrow(
      FolderNameTakenError,
    );
  });

  it("rethrows unrelated errors", async () => {
    const returning = vi.fn().mockRejectedValue(new Error("connection lost"));
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });

    await expect(createFolder("user-1", "New")).rejects.toThrow(
      "connection lost",
    );
  });
});

describe("renameFolder", () => {
  it("updates and returns the renamed folder", async () => {
    const returning = vi
      .fn()
      .mockResolvedValue([{ id: "f1", name: "Renamed" }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    const result = await renameFolder("user-1", "f1", "Renamed");

    expect(result).toEqual({ id: "f1", name: "Renamed" });
  });

  it("throws FolderNotFoundError when nothing matched", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    await expect(renameFolder("user-1", "missing", "x")).rejects.toThrow(
      FolderNotFoundError,
    );
  });

  it("throws FolderNameTakenError on a unique constraint violation", async () => {
    const returning = vi.fn().mockRejectedValue({ code: "23505" });
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    await expect(renameFolder("user-1", "f1", "Dup")).rejects.toThrow(
      FolderNameTakenError,
    );
  });
});

describe("deleteFolder", () => {
  it("deletes scoped to the user", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    deleteMock.mockReturnValue({ where });

    await deleteFolder("user-1", "f1");

    expect(deleteMock).toHaveBeenCalled();
    expect(where).toHaveBeenCalled();
  });
});
