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

const { createFolder, deleteFolder, listFolders, renameFolder } =
  await import("./service");

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
});

describe("listFolders", () => {
  it("scopes the query to the user", async () => {
    const where = vi.fn().mockResolvedValue([{ id: "f1", name: "Ideas" }]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await listFolders("user-1");

    expect(result).toEqual([{ id: "f1", name: "Ideas" }]);
  });
});

describe("createFolder", () => {
  it("inserts a folder scoped to the user", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "f1", name: "Ideas" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });

    const folder = await createFolder("user-1", "Ideas");

    expect(values).toHaveBeenCalledWith({ userId: "user-1", name: "Ideas" });
    expect(folder).toEqual({ id: "f1", name: "Ideas" });
  });
});

describe("renameFolder", () => {
  it("returns null when the folder isn't owned by the user", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    const result = await renameFolder("user-1", "f1", "New name");

    expect(result).toBeNull();
  });
});

describe("deleteFolder", () => {
  it("returns false when nothing was deleted", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    deleteMock.mockReturnValue({ where });

    const result = await deleteFolder("user-1", "f1");

    expect(result).toBe(false);
  });

  it("returns true when a row was deleted", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "f1" }]);
    const where = vi.fn().mockReturnValue({ returning });
    deleteMock.mockReturnValue({ where });

    const result = await deleteFolder("user-1", "f1");

    expect(result).toBe(true);
  });
});
