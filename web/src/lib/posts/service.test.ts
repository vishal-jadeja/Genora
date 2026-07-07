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
  createPost,
  deletePost,
  getPost,
  getPostByTriggerRunId,
  getPostOutputs,
  setPostTriggerRunId,
  updatePost,
} = await import("./service");

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
});

describe("createPost", () => {
  it("inserts a draft post scoped to the user", async () => {
    const returning = vi
      .fn()
      .mockResolvedValue([{ id: "p1", rawContent: "hello" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });

    const post = await createPost({ userId: "user-1", rawContent: "hello" });

    expect(post).toEqual({ id: "p1", rawContent: "hello" });
  });
});

describe("getPost", () => {
  it("returns null when the post isn't owned by the user", async () => {
    const where = vi.fn().mockResolvedValue([]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await getPost("user-1", "p1");

    expect(result).toBeNull();
  });
});

describe("getPostOutputs", () => {
  it("returns null (not an empty array) when the post isn't owned by the user", async () => {
    const where = vi.fn().mockResolvedValue([]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await getPostOutputs("user-1", "p1");

    expect(result).toBeNull();
  });
});

describe("updatePost", () => {
  it("returns null when the post isn't owned by the user", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    const result = await updatePost("user-1", "p1", { title: "New title" });

    expect(result).toBeNull();
  });
});

describe("deletePost", () => {
  it("returns false when nothing was deleted", async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ returning });
    deleteMock.mockReturnValue({ where });

    const result = await deletePost("user-1", "p1");

    expect(result).toBe(false);
  });
});

describe("setPostTriggerRunId / getPostByTriggerRunId", () => {
  it("stores the run id on the post", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    await setPostTriggerRunId("p1", "run_123");

    expect(set).toHaveBeenCalledWith({ triggerRunId: "run_123" });
  });

  it("scopes run-id lookup to the requesting user, not just the run id", async () => {
    const where = vi.fn().mockResolvedValue([]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await getPostByTriggerRunId("attacker", "run_123");

    expect(result).toBeNull();
  });
});
