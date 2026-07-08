import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  GeneratePlatformPostOutput,
  GeneratePlatformPostPayload,
} from "./generatePlatformPost";

const callAiServiceMock = vi.fn();
const resolveGenerationKeyMock = vi.fn();
const selectMock = vi.fn();

vi.mock("@trigger.dev/sdk", () => ({
  task: (params: unknown) => params,
  AbortTaskRunError: class AbortTaskRunError extends Error {},
}));

class MockAiServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

vi.mock("@/lib/aiService/client", () => ({
  AiServiceError: MockAiServiceError,
  callAiService: (...args: unknown[]) => callAiServiceMock(...args),
}));

vi.mock("@/lib/generation/resolveGenerationKey", () => ({
  GenerationKeyError: class GenerationKeyError extends Error {},
  resolveGenerationKey: (...args: unknown[]) =>
    resolveGenerationKeyMock(...args),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const { generatePlatformPost } = await import("./generatePlatformPost");

const run = (
  generatePlatformPost as unknown as {
    run: (
      payload: GeneratePlatformPostPayload,
    ) => Promise<GeneratePlatformPostOutput>;
  }
).run;

const basePayload: GeneratePlatformPostPayload = {
  postId: "post-1",
  userId: "user-1",
  platform: "linkedin",
  rawText: "hello",
  modelId: "groq",
};

beforeEach(() => {
  callAiServiceMock.mockReset();
  resolveGenerationKeyMock.mockReset();
  selectMock.mockReset();

  resolveGenerationKeyMock.mockResolvedValue({
    provider: "groq",
    apiModel: "openai/gpt-oss-120b",
    apiKey: "test-key",
  });
  const where = vi.fn().mockResolvedValue([]);
  const from = vi.fn().mockReturnValue({ where });
  selectMock.mockReturnValue({ from });
});

function mockRagThenGenerateRejection(err: unknown) {
  callAiServiceMock
    .mockResolvedValueOnce({ matches: [] }) // /rag/retrieve
    .mockRejectedValueOnce(err); // /generate
}

describe("generatePlatformPost", () => {
  it("fails fast (no retry) on a 401 from ai-service /generate", async () => {
    mockRagThenGenerateRejection(new MockAiServiceError(401, "bad key"));

    const result = await run(basePayload);

    expect(result).toEqual({
      status: "failed",
      errorReason: "bad key",
    });
  });

  it("fails fast (no retry) on a 429 from ai-service /generate", async () => {
    mockRagThenGenerateRejection(new MockAiServiceError(429, "rate limited"));

    const result = await run(basePayload);

    expect(result).toEqual({
      status: "failed",
      errorReason: "rate limited",
    });
  });

  it("rethrows a 503 from ai-service /generate so Trigger.dev retries", async () => {
    mockRagThenGenerateRejection(new MockAiServiceError(503, "unavailable"));

    await expect(run(basePayload)).rejects.toThrow("unavailable");
  });

  it("returns success on a normal /generate response", async () => {
    callAiServiceMock
      .mockResolvedValueOnce({ matches: [] }) // /rag/retrieve
      .mockResolvedValueOnce({
        content: "final",
        revision_count: 1,
        usage: [
          { stage: "writer", prompt_tokens: 10, completion_tokens: 20 },
        ],
      });

    const result = await run(basePayload);

    expect(result).toEqual({
      status: "success",
      content: "final",
      revisionCount: 1,
      usage: [{ stage: "writer", promptTokens: 10, completionTokens: 20 }],
    });
  });
});
