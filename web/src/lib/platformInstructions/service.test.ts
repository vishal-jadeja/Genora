import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/db/client", () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
    insert: (...args: unknown[]) => insertMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

const {
  listPlatformInstructions,
  upsertPlatformInstructions,
  deletePlatformInstructions,
} = await import("./service");

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  deleteMock.mockReset();
});

describe("listPlatformInstructions", () => {
  it("fills in every platform, defaulting unset ones to empty instructions", async () => {
    const where = vi
      .fn()
      .mockResolvedValue([
        { platform: "linkedin", instructions: "Be terse", updatedAt: null },
      ]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await listPlatformInstructions("user-1");

    expect(result).toEqual([
      { platform: "linkedin", instructions: "Be terse", updatedAt: null },
      { platform: "x", instructions: "", updatedAt: null },
      { platform: "reddit", instructions: "", updatedAt: null },
      { platform: "medium", instructions: "", updatedAt: null },
      { platform: "substack", instructions: "", updatedAt: null },
    ]);
  });
});

describe("upsertPlatformInstructions", () => {
  it("upserts on the (userId, platform) conflict target", async () => {
    const returning = vi
      .fn()
      .mockResolvedValue([{ platform: "x", instructions: "Short posts" }]);
    const onConflictDoUpdate = vi.fn().mockReturnValue({ returning });
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    insertMock.mockReturnValue({ values });

    const result = await upsertPlatformInstructions(
      "user-1",
      "x",
      "Short posts",
    );

    expect(values).toHaveBeenCalledWith({
      userId: "user-1",
      platform: "x",
      instructions: "Short posts",
    });
    expect(result).toEqual({ platform: "x", instructions: "Short posts" });
  });
});

describe("deletePlatformInstructions", () => {
  it("deletes scoped to the user and platform", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    deleteMock.mockReturnValue({ where });

    await deletePlatformInstructions("user-1", "reddit");

    expect(deleteMock).toHaveBeenCalled();
  });
});
