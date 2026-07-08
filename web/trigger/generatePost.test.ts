import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeneratePostOutput, GeneratePostPayload } from "./generatePost";

const persistSuccessMock = vi.fn();
const persistFailureMock = vi.fn();
const triggerAndWaitMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@trigger.dev/sdk", () => ({
  task: (params: unknown) => params,
  AbortTaskRunError: class AbortTaskRunError extends Error {},
}));

vi.mock("@/lib/generation/persistResult", () => ({
  persistSuccess: (...args: unknown[]) => persistSuccessMock(...args),
  persistFailure: (...args: unknown[]) => persistFailureMock(...args),
}));

vi.mock("./generatePlatformPost", () => ({
  generatePlatformPost: {
    triggerAndWait: (...args: unknown[]) => triggerAndWaitMock(...args),
  },
}));

vi.mock("@/db/client", () => ({
  db: {
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

const { generatePost } = await import("./generatePost");

// The public Task<> type doesn't expose `.run` (it's meant to be invoked via
// the platform), but the mocked `task()` above returns params.run unchanged
// on the object, so it's callable directly here for a unit test.
const run = (
  generatePost as unknown as {
    run: (payload: GeneratePostPayload) => Promise<GeneratePostOutput>;
  }
).run;

const basePayload = {
  postId: "post-1",
  userId: "user-1",
  rawText: "hello",
};

beforeEach(() => {
  persistSuccessMock.mockReset();
  persistFailureMock.mockReset();
  triggerAndWaitMock.mockReset();
  updateMock.mockReset();
});

describe("generatePost", () => {
  it("throws AbortTaskRunError for an unknown model id before triggering anything", async () => {
    const { AbortTaskRunError } = await import("@trigger.dev/sdk");

    await expect(
      run({
        ...basePayload,
        platforms: [{ platform: "linkedin", modelId: "made-up" as never }],
      }),
    ).rejects.toThrow(AbortTaskRunError);
    expect(triggerAndWaitMock).not.toHaveBeenCalled();
  });

  it("persists success and marks the post generated when a platform succeeds", async () => {
    triggerAndWaitMock.mockResolvedValue({
      ok: true,
      output: {
        status: "success",
        content: "final",
        revisionCount: 1,
        usage: [],
      },
    });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    const result = await run({
      ...basePayload,
      platforms: [{ platform: "linkedin", modelId: "groq" }],
    });

    expect(result).toEqual({
      results: [{ platform: "linkedin", status: "success" }],
    });
    expect(persistSuccessMock).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "generated" }),
    );
  });

  it("does not touch posts.status when every platform fails", async () => {
    triggerAndWaitMock.mockResolvedValue({
      ok: true,
      output: { status: "failed", errorReason: "boom" },
    });

    const result = await run({
      ...basePayload,
      platforms: [{ platform: "linkedin", modelId: "groq" }],
    });

    expect(result).toEqual({
      results: [{ platform: "linkedin", status: "failed" }],
    });
    expect(persistFailureMock).toHaveBeenCalledTimes(1);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("treats a triggerAndWait rejection (run.ok === false) as a platform failure", async () => {
    triggerAndWaitMock.mockResolvedValue({
      ok: false,
      error: new Error("child task crashed"),
    });

    const result = await run({
      ...basePayload,
      platforms: [{ platform: "x", modelId: "groq" }],
    });

    expect(result).toEqual({ results: [{ platform: "x", status: "failed" }] });
    expect(persistFailureMock).toHaveBeenCalledWith(
      expect.objectContaining({ errorReason: "child task crashed" }),
    );
  });

  it("marks the post generated if at least one of several platforms succeeds", async () => {
    triggerAndWaitMock
      .mockResolvedValueOnce({
        ok: true,
        output: {
          status: "success",
          content: "final",
          revisionCount: 0,
          usage: [],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        output: { status: "failed", errorReason: "boom" },
      });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    const result = await run({
      ...basePayload,
      platforms: [
        { platform: "linkedin", modelId: "groq" },
        { platform: "x", modelId: "gemini" },
      ],
    });

    expect(result.results).toHaveLength(2);
    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
