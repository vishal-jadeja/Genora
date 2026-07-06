import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");

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

const { listApiKeys, upsertApiKey, deleteApiKey } = await import("./service");

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  deleteMock.mockReset();
});

describe("listApiKeys", () => {
  it("returns exactly one entry per provider, marking unconfigured ones as not connected", async () => {
    const where = vi.fn().mockResolvedValue([
      {
        provider: "anthropic",
        label: "work key",
        lastUsedAt: null,
      },
    ]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const result = await listApiKeys("user-1");

    expect(result).toHaveLength(4);
    expect(result).toContainEqual({
      provider: "anthropic",
      label: "work key",
      lastUsedAt: null,
      connected: true,
    });
    expect(result).toContainEqual({
      provider: "openai",
      label: null,
      lastUsedAt: null,
      connected: false,
    });
  });
});

describe("upsertApiKey", () => {
  it("encrypts the raw key and never stores the plaintext", async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    insertMock.mockReturnValue({ values });

    await upsertApiKey("user-1", "anthropic", "sk-ant-raw-secret", "work");

    expect(values).toHaveBeenCalledTimes(1);
    const insertedRow = values.mock.calls[0][0];
    expect(insertedRow.encryptedKey).not.toContain("sk-ant-raw-secret");
    expect(insertedRow.iv).toBeDefined();
    expect(insertedRow.authTag).toBeDefined();
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.any(Array),
        set: expect.objectContaining({ label: "work" }),
      }),
    );
  });
});

describe("deleteApiKey", () => {
  it("deletes the row scoped to userId + provider", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    deleteMock.mockReturnValue({ where });

    await deleteApiKey("user-1", "anthropic");

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
  });
});
