import { describe, expect, it } from "vitest";
import { generatePostSchema } from "./schema";

const base = {
  rawText: "a genuinely substantive raw thought",
};

describe("generatePostSchema", () => {
  it("accepts one selection per platform", () => {
    const result = generatePostSchema.safeParse({
      ...base,
      platforms: [
        { platform: "linkedin", modelId: "groq" },
        { platform: "x", modelId: "gemini" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects the same platform selected twice", () => {
    const result = generatePostSchema.safeParse({
      ...base,
      platforms: [
        { platform: "linkedin", modelId: "groq" },
        { platform: "linkedin", modelId: "gemini" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown model id", () => {
    const result = generatePostSchema.safeParse({
      ...base,
      platforms: [{ platform: "linkedin", modelId: "made-up" }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty platforms array", () => {
    const result = generatePostSchema.safeParse({ ...base, platforms: [] });

    expect(result.success).toBe(false);
  });
});
