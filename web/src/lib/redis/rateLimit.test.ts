import { describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({ redis: {} }));

const slidingWindowMock = vi.fn((tokens: number, window: string) => ({
  tokens,
  window,
}));
const RatelimitMock = vi.fn(function (this: unknown, config: unknown) {
  Object.assign(this as object, config);
});
(
  RatelimitMock as unknown as { slidingWindow: typeof slidingWindowMock }
).slidingWindow = slidingWindowMock;

vi.mock("@upstash/ratelimit", () => ({ Ratelimit: RatelimitMock }));

const { createRateLimiter, checkRateLimit } = await import("./rateLimit");

describe("createRateLimiter", () => {
  it("builds a Ratelimit with a sliding window and the genora prefix", () => {
    const limiter = createRateLimiter({ tokens: 5, window: "10 s" });

    expect(slidingWindowMock).toHaveBeenCalledWith(5, "10 s");
    expect(RatelimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limiter: { tokens: 5, window: "10 s" },
        prefix: "genora:ratelimit",
      }),
    );
    expect(limiter).toBeInstanceOf(RatelimitMock);
  });
});

describe("checkRateLimit", () => {
  it("maps a successful limiter response to allowed:true", async () => {
    const fakeLimiter = {
      limit: vi.fn().mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: 123,
      }),
    };

    const result = await checkRateLimit(fakeLimiter as never, "user-1");

    expect(fakeLimiter.limit).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      allowed: true,
      limit: 5,
      remaining: 4,
      reset: 123,
    });
  });

  it("maps a rejected limiter response to allowed:false", async () => {
    const fakeLimiter = {
      limit: vi.fn().mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: 456,
      }),
    };

    const result = await checkRateLimit(fakeLimiter as never, "user-2");

    expect(result).toEqual({
      allowed: false,
      limit: 5,
      remaining: 0,
      reset: 456,
    });
  });
});
