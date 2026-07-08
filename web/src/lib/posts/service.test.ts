import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const folderBelongsToUserMock = vi.fn();

vi.mock("@/db/client", () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
    insert: (...args: unknown[]) => insertMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

vi.mock("@/lib/folders/service", () => ({
  folderBelongsToUser: (...args: unknown[]) => folderBelongsToUserMock(...args),
}));

const {
  listPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
  PostNotFoundError,
  FolderNotOwnedError,
} = await import("./service");

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
  folderBelongsToUserMock.mockReset();
});

describe("listPosts", () => {
  it("orders by createdAt desc", async () => {
    const orderBy = vi.fn().mockResolvedValue([{ id: "p1" }]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await listPosts("user-1");

    expect(result).toEqual([{ id: "p1" }]);
    expect(orderBy).toHaveBeenCalled();
  });
});

describe("createPost", () => {
  it("inserts and returns the new post", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "p1" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });

    const result = await createPost("user-1", { rawContent: "hello" });

    expect(values).toHaveBeenCalledWith({
      userId: "user-1",
      rawContent: "hello",
      title: undefined,
      folderId: undefined,
    });
    expect(result).toEqual({ id: "p1" });
  });

  it("throws FolderNotOwnedError without inserting when the folder isn't the user's", async () => {
    folderBelongsToUserMock.mockResolvedValue(false);

    await expect(
      createPost("user-1", { rawContent: "hello", folderId: "folder-1" }),
    ).rejects.toThrow(FolderNotOwnedError);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts when the folder belongs to the user", async () => {
    folderBelongsToUserMock.mockResolvedValue(true);
    const returning = vi.fn().mockResolvedValue([{ id: "p1" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });

    await createPost("user-1", { rawContent: "hello", folderId: "folder-1" });

    expect(folderBelongsToUserMock).toHaveBeenCalledWith("user-1", "folder-1");
    expect(insertMock).toHaveBeenCalled();
  });
});

describe("getPost", () => {
  it("throws PostNotFoundError when the post doesn't exist", async () => {
    const where = vi.fn().mockResolvedValue([]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    await expect(getPost("user-1", "missing")).rejects.toThrow(
      PostNotFoundError,
    );
  });

  it("returns the post with its current platform outputs", async () => {
    const postWhere = vi.fn().mockResolvedValue([{ id: "p1" }]);
    const outputsWhere = vi
      .fn()
      .mockResolvedValue([{ id: "o1", platform: "linkedin" }]);
    selectMock
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: postWhere }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ where: outputsWhere }),
      });

    const result = await getPost("user-1", "p1");

    expect(result).toEqual({
      id: "p1",
      platformOutputs: [{ id: "o1", platform: "linkedin" }],
    });
  });
});

describe("updatePost", () => {
  it("throws PostNotFoundError when nothing matched", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    await expect(
      updatePost("user-1", "missing", { title: "New" }),
    ).rejects.toThrow(PostNotFoundError);
  });

  it("updates and returns the post", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "p1", title: "New" }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    const result = await updatePost("user-1", "p1", { title: "New" });

    expect(result).toEqual({ id: "p1", title: "New" });
  });

  it("throws FolderNotOwnedError without updating when the folder isn't the user's", async () => {
    folderBelongsToUserMock.mockResolvedValue(false);

    await expect(
      updatePost("user-1", "p1", { folderId: "folder-1" }),
    ).rejects.toThrow(FolderNotOwnedError);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("allows clearing the folder without an ownership check", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "p1", folderId: null }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    await updatePost("user-1", "p1", { folderId: null });

    expect(folderBelongsToUserMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
  });
});

describe("deletePost", () => {
  it("deletes scoped to the user", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "p1" }]);
    const where = vi.fn().mockReturnValue({ returning });
    deleteMock.mockReturnValue({ where });

    await deletePost("user-1", "p1");

    expect(deleteMock).toHaveBeenCalled();
  });

  it("throws PostNotFoundError when nothing matched", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    deleteMock.mockReturnValue({ where });

    await expect(deletePost("user-1", "missing")).rejects.toThrow(
      PostNotFoundError,
    );
  });
});
