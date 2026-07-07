import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveKeyForGenerationMock = vi.fn();

vi.mock("@/lib/keys/resolveKey", () => ({
  resolveKeyForGeneration: (...args: unknown[]) =>
    resolveKeyForGenerationMock(...args),
}));

const { resolveGenerationKey, GenerationKeyError } =
  await import("./resolveGenerationKey");

beforeEach(() => {
  resolveKeyForGenerationMock.mockReset();
  delete process.env.PLATFORM_ANTHROPIC_API_KEY;
});

describe("resolveGenerationKey", () => {
  it("throws for an unknown model id", async () => {
    await expect(
      resolveGenerationKey("user-1", "made-up" as never),
    ).rejects.toThrow(GenerationKeyError);
    expect(resolveKeyForGenerationMock).not.toHaveBeenCalled();
  });

  it("uses the user's BYOK key when present, even for the free model", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "byok",
      provider: "anthropic",
      apiKey: "sk-ant-user-key",
    });

    const result = await resolveGenerationKey("user-1", "sonnet");

    expect(resolveKeyForGenerationMock).toHaveBeenCalledWith({
      userId: "user-1",
      provider: "anthropic",
    });
    expect(result).toEqual({
      provider: "anthropic",
      apiModel: "claude-sonnet-4-5",
      apiKey: "sk-ant-user-key",
    });
  });

  it("falls back to the platform key for the free model when no BYOK key exists", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "free-tier",
      provider: "anthropic",
      model: "TBD",
      quota: { remaining: null, limit: null, resetAt: null },
    });
    process.env.PLATFORM_ANTHROPIC_API_KEY = "sk-ant-platform-key";

    const result = await resolveGenerationKey("user-1", "sonnet");

    expect(result).toEqual({
      provider: "anthropic",
      apiModel: "claude-sonnet-4-5",
      apiKey: "sk-ant-platform-key",
    });
  });

  it("throws if the platform key is missing for the free model", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "free-tier",
      provider: "anthropic",
      model: "TBD",
      quota: { remaining: null, limit: null, resetAt: null },
    });

    await expect(resolveGenerationKey("user-1", "sonnet")).rejects.toThrow(
      GenerationKeyError,
    );
  });

  it("throws for a paid model with no BYOK key on file, rather than falling back", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "free-tier",
      provider: "openai",
      model: "TBD",
      quota: { remaining: null, limit: null, resetAt: null },
    });

    await expect(resolveGenerationKey("user-1", "gpt5")).rejects.toThrow(
      /requires a BYOK openai key/,
    );
  });
});
