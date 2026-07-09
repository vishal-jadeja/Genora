import { describe, expect, it } from "vitest";
import { addApiKeySchema } from "./schema";

describe("addApiKeySchema", () => {
  it("accepts a normal key/label", () => {
    const result = addApiKeySchema.safeParse({
      provider: "groq",
      key: "gsk-abc123",
      label: "personal",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a key over 2000 chars", () => {
    const result = addApiKeySchema.safeParse({
      provider: "groq",
      key: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a label over 200 chars", () => {
    const result = addApiKeySchema.safeParse({
      provider: "groq",
      key: "gsk-abc123",
      label: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
