import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiServiceError, callAiService } from "./client";

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.AI_SERVICE_URL = "http://localhost:9999";
  process.env.INTERNAL_SERVICE_SECRET = "test-secret";
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
  vi.useRealTimers();
});

describe("callAiService", () => {
  it("resolves normally on a fast successful response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" }),
    }) as unknown as typeof fetch;

    const result = await callAiService("/slop-guard", { raw_text: "hi" });

    expect(result).toEqual({ hello: "world" });
  });

  it("throws a 504 AiServiceError when the call exceeds the timeout", async () => {
    global.fetch = vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    ) as unknown as typeof fetch;

    await expect(
      callAiService("/slop-guard", { raw_text: "hi" }, { timeoutMs: 10 }),
    ).rejects.toMatchObject({ status: 504 } satisfies Partial<AiServiceError>);
  });

  it("throws AiServiceError with the response status on a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    }) as unknown as typeof fetch;

    await expect(
      callAiService("/slop-guard", { raw_text: "hi" }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
