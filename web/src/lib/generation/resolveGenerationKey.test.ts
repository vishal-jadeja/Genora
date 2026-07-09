import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveKeyForGenerationMock = vi.fn();

class MockKeyDecryptionError extends Error {}

vi.mock("@/lib/keys/resolveKey", () => ({
  resolveKeyForGeneration: (...args: unknown[]) =>
    resolveKeyForGenerationMock(...args),
  KeyDecryptionError: MockKeyDecryptionError,
}));

const { resolveGenerationKey, GenerationKeyError } =
  await import("./resolveGenerationKey");

beforeEach(() => {
  resolveKeyForGenerationMock.mockReset();
  delete process.env.PLATFORM_GROQ_API_KEY;
  delete process.env.PLATFORM_GEMINI_API_KEY;
});

describe("resolveGenerationKey", () => {
  it("throws for an unknown model id", async () => {
    await expect(
      resolveGenerationKey("user-1", "made-up" as never),
    ).rejects.toThrow(GenerationKeyError);
    expect(resolveKeyForGenerationMock).not.toHaveBeenCalled();
  });

  it("uses the user's BYOK key when present, even for a free model", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "byok",
      provider: "groq",
      apiKey: "gsk-user-key",
    });

    const result = await resolveGenerationKey("user-1", "groq");

    expect(resolveKeyForGenerationMock).toHaveBeenCalledWith({
      userId: "user-1",
      provider: "groq",
    });
    expect(result).toEqual({
      provider: "groq",
      apiModel: "openai/gpt-oss-120b",
      apiKey: "gsk-user-key",
    });
  });

  it("falls back to the platform Groq key for the groq free model when no BYOK key exists", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "free-tier",
      provider: "groq",
      model: "TBD",
      quota: { remaining: null, limit: null, resetAt: null },
    });
    process.env.PLATFORM_GROQ_API_KEY = "gsk-platform-key";

    const result = await resolveGenerationKey("user-1", "groq");

    expect(result).toEqual({
      provider: "groq",
      apiModel: "openai/gpt-oss-120b",
      apiKey: "gsk-platform-key",
    });
  });

  it("falls back to the platform Gemini key for the gemini free model when no BYOK key exists", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "free-tier",
      provider: "gemini",
      model: "TBD",
      quota: { remaining: null, limit: null, resetAt: null },
    });
    process.env.PLATFORM_GEMINI_API_KEY = "aiza-platform-key";

    const result = await resolveGenerationKey("user-1", "gemini");

    expect(result).toEqual({
      provider: "gemini",
      apiModel: "gemini-2.5-flash",
      apiKey: "aiza-platform-key",
    });
  });

  it("throws if the platform key is missing for a free model", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "free-tier",
      provider: "groq",
      model: "TBD",
      quota: { remaining: null, limit: null, resetAt: null },
    });

    await expect(resolveGenerationKey("user-1", "groq")).rejects.toThrow(
      GenerationKeyError,
    );
  });

  it("maps a KeyDecryptionError to GenerationKeyError instead of an unhandled retryable error", async () => {
    resolveKeyForGenerationMock.mockRejectedValue(
      new MockKeyDecryptionError("stored key for groq could not be decrypted"),
    );

    await expect(resolveGenerationKey("user-1", "groq")).rejects.toThrow(
      GenerationKeyError,
    );
  });

  it("rethrows a plain (non-decryption) error from resolveKeyForGeneration unchanged", async () => {
    resolveKeyForGenerationMock.mockRejectedValue(new Error("db unavailable"));

    await expect(resolveGenerationKey("user-1", "groq")).rejects.toThrow(
      "db unavailable",
    );
    await expect(resolveGenerationKey("user-1", "groq")).rejects.not.toThrow(
      GenerationKeyError,
    );
  });

  it("throws for a paid model with no BYOK key on file, rather than falling back", async () => {
    resolveKeyForGenerationMock.mockResolvedValue({
      source: "free-tier",
      provider: "anthropic",
      model: "TBD",
      quota: { remaining: null, limit: null, resetAt: null },
    });

    await expect(resolveGenerationKey("user-1", "sonnet")).rejects.toThrow(
      /requires a BYOK anthropic key/,
    );
  });
});
