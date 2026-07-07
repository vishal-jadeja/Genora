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
  deletePlatformInstructions,
  listPlatformInstructions,
  upsertPlatformInstructions,
} = await import("./service");

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  deleteMock.mockReset();
});

describe("listPlatformInstructions", () => {
  it("returns exactly one entry per platform, defaulting unset ones to an empty string", async () => {
    const where = vi
      .fn()
      .mockResolvedValue([
        { platform: "linkedin", instructions: "Keep it punchy." },
      ]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await listPlatformInstructions("user-1");

    expect(result).toHaveLength(5);
    expect(result).toContainEqual({
      platform: "linkedin",
      instructions: "Keep it punchy.",
    });
    expect(result).toContainEqual({ platform: "x", instructions: "" });
  });
});

describe("upsertPlatformInstructions", () => {
  it("upserts scoped to (userId, platform)", async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    insertMock.mockReturnValue({ values });

    await upsertPlatformInstructions("user-1", "reddit", "Be blunt.");

    expect(values).toHaveBeenCalledWith({
      userId: "user-1",
      platform: "reddit",
      instructions: "Be blunt.",
    });
  });
});

describe("deletePlatformInstructions", () => {
  it("deletes the row scoped to (userId, platform)", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    deleteMock.mockReturnValue({ where });

    await deletePlatformInstructions("user-1", "reddit");

    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});
