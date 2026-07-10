import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeneratePostOutput, GeneratePostPayload } from "./generatePost";

const persistSuccessMock = vi.fn();
const persistFailureMock = vi.fn();
const triggerAndWaitMock = vi.fn();
const updateMock = vi.fn();
const resolveGenerationKeyMock = vi.fn();

vi.mock("@trigger.dev/sdk", () => ({
  task: (params: unknown) => params,
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  AbortTaskRunError: class AbortTaskRunError extends Error {},
}));

vi.mock("@/lib/generation/persistResult", () => ({
  persistSuccess: (...args: unknown[]) => persistSuccessMock(...args),
  persistFailure: (...args: unknown[]) => persistFailureMock(...args),
}));

vi.mock("@/lib/generation/resolveGenerationKey", () => ({
  GenerationKeyError: class GenerationKeyError extends Error {},
  resolveGenerationKey: (...args: unknown[]) =>
    resolveGenerationKeyMock(...args),
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
  correlationId: "corr-1",
};

beforeEach(() => {
  persistSuccessMock.mockReset();
  persistFailureMock.mockReset();
  triggerAndWaitMock.mockReset();
  updateMock.mockReset();
  resolveGenerationKeyMock.mockReset();
  resolveGenerationKeyMock.mockResolvedValue({
    provider: "groq",
    apiModel: "openai/gpt-oss-120b",
    apiKey: "test-key",
  });
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

  it("degrades to a failed result instead of throwing when persistSuccess rejects", async () => {
    triggerAndWaitMock.mockResolvedValue({
      ok: true,
      output: {
        status: "success",
        content: "final",
        revisionCount: 1,
        usage: [],
      },
    });
    persistSuccessMock.mockRejectedValue(new Error("db unavailable"));
    persistFailureMock.mockResolvedValue(undefined);

    const result = await run({
      ...basePayload,
      platforms: [{ platform: "linkedin", modelId: "groq" }],
    });

    expect(result).toEqual({
      results: [{ platform: "linkedin", status: "failed" }],
    });
    expect(persistFailureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errorReason: expect.stringContaining("db unavailable"),
      }),
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("does not throw when both persistSuccess and persistFailure reject", async () => {
    triggerAndWaitMock.mockResolvedValue({
      ok: true,
      output: {
        status: "success",
        content: "final",
        revisionCount: 1,
        usage: [],
      },
    });
    persistSuccessMock.mockRejectedValue(new Error("db unavailable"));
    persistFailureMock.mockRejectedValue(new Error("db still unavailable"));

    const result = await run({
      ...basePayload,
      platforms: [{ platform: "linkedin", modelId: "groq" }],
    });

    expect(result).toEqual({
      results: [{ platform: "linkedin", status: "failed" }],
    });
  });

  it("does not reject the whole run when persistFailure rejects on a normal generation failure", async () => {
    triggerAndWaitMock.mockResolvedValue({
      ok: true,
      output: { status: "failed", errorReason: "boom" },
    });
    persistFailureMock.mockRejectedValue(new Error("db unavailable"));

    const result = await run({
      ...basePayload,
      platforms: [{ platform: "linkedin", modelId: "groq" }],
    });

    expect(result).toEqual({
      results: [{ platform: "linkedin", status: "failed" }],
    });
  });

  it("resolves the generation key once per platform and passes it into the child payload", async () => {
    triggerAndWaitMock.mockResolvedValue({
      ok: true,
      output: {
        status: "success",
        content: "final",
        revisionCount: 0,
        usage: [],
      },
    });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });

    await run({
      ...basePayload,
      platforms: [
        { platform: "linkedin", modelId: "groq" },
        { platform: "x", modelId: "gemini" },
      ],
    });

    expect(resolveGenerationKeyMock).toHaveBeenCalledTimes(2);
    expect(triggerAndWaitMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        generationKey: {
          provider: "groq",
          apiModel: "openai/gpt-oss-120b",
          apiKey: "test-key",
        },
      }),
    );
  });

  it("records a failure and never triggers the child task when key resolution fails (e.g. quota exhausted)", async () => {
    const { GenerationKeyError } = await import(
      "@/lib/generation/resolveGenerationKey"
    );
    resolveGenerationKeyMock.mockRejectedValue(
      new GenerationKeyError("free-tier quota exhausted"),
    );

    const result = await run({
      ...basePayload,
      platforms: [{ platform: "linkedin", modelId: "groq" }],
    });

    expect(result).toEqual({
      results: [{ platform: "linkedin", status: "failed" }],
    });
    expect(triggerAndWaitMock).not.toHaveBeenCalled();
    expect(persistFailureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errorReason: "free-tier quota exhausted",
      }),
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
