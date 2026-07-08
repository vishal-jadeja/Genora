import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();
const executeMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/db/client", () => ({
  db: {
    transaction: (cb: (tx: unknown) => unknown) => transactionMock(cb),
  },
}));

const { persistFailure, persistSuccess } = await import("./persistResult");

const tx = {
  select: (...args: unknown[]) => selectMock(...args),
  insert: (...args: unknown[]) => insertMock(...args),
  update: (...args: unknown[]) => updateMock(...args),
  execute: (...args: unknown[]) => executeMock(...args),
};

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  updateMock.mockReset();
  executeMock.mockReset();
  transactionMock.mockReset();
  transactionMock.mockImplementation((cb) => cb(tx));
  executeMock.mockResolvedValue(undefined);

  const where = vi.fn().mockResolvedValue([{ maxVersion: 2 }]);
  const from = vi.fn().mockReturnValue({ where });
  selectMock.mockReturnValue({ from });

  const updateWhere = vi.fn().mockResolvedValue(undefined);
  updateMock.mockReturnValue({
    set: vi.fn().mockReturnValue({ where: updateWhere }),
  });
});

describe("persistSuccess", () => {
  it("supersedes the prior current row, inserts at the next version, and logs usage cost", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "output-1" }]);
    const outputsValues = vi.fn().mockReturnValue({ returning });
    const usageValues = vi.fn().mockResolvedValue(undefined);
    insertMock
      .mockReturnValueOnce({ values: outputsValues })
      .mockReturnValueOnce({ values: usageValues });

    await persistSuccess({
      postId: "post-1",
      userId: "user-1",
      platform: "linkedin",
      provider: "anthropic",
      apiModel: "claude-sonnet-4-5",
      modelId: "sonnet",
      content: "final draft",
      revisionCount: 1,
      usage: [
        { stage: "writer", promptTokens: 1_000_000, completionTokens: 0 },
      ],
    });

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
    // Lock must be taken before the read-then-write (supersede + next
    // version) that it's protecting, not after.
    expect(executeMock.mock.invocationCallOrder[0]).toBeLessThan(
      updateMock.mock.invocationCallOrder[0],
    );
    expect(executeMock.mock.invocationCallOrder[0]).toBeLessThan(
      selectMock.mock.invocationCallOrder[0],
    );

    const outputsRow = outputsValues.mock.calls[0][0];
    expect(outputsRow).toMatchObject({
      postId: "post-1",
      platform: "linkedin",
      version: 3,
      status: "success",
      isCurrent: true,
      content: "final draft",
    });

    const usageRows = usageValues.mock.calls[0][0];
    expect(usageRows).toHaveLength(1);
    expect(usageRows[0]).toMatchObject({
      platformOutputId: "output-1",
      totalTokens: 1_000_000,
      costUsd: "3.000000",
    });
  });

  it("skips the usage_logs insert when there's no usage to record", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "output-1" }]);
    const outputsValues = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValueOnce({ values: outputsValues });

    await persistSuccess({
      postId: "post-1",
      userId: "user-1",
      platform: "x",
      provider: "anthropic",
      apiModel: "claude-sonnet-4-5",
      modelId: "sonnet",
      content: "final draft",
      revisionCount: 0,
      usage: [],
    });

    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});

describe("persistFailure", () => {
  it("inserts a failed row at the next version without touching usage_logs", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValueOnce({ values });

    await persistFailure({
      postId: "post-1",
      userId: "user-1",
      platform: "reddit",
      provider: "openai",
      apiModel: "gpt-5",
      errorReason: "ai-service generate failed: 503",
    });

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(values.mock.calls[0][0]).toMatchObject({
      postId: "post-1",
      platform: "reddit",
      version: 3,
      status: "failed",
      errorReason: "ai-service generate failed: 503",
    });
  });
});

// Note: these are unit tests against mocked tx.select/insert/update/execute
// calls, so they can only prove the advisory lock is *invoked* in the right
// order — they can't prove the race is actually closed under real concurrent
// writes. That requires an integration test against a real Postgres
// instance, which this repo's web test suite doesn't have a harness for yet
// (see backend-plan.md's phased roadmap — no such harness has been built).
