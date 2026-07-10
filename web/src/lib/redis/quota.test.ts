import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({ redis: {} }));

const slidingWindowMock = vi.fn((tokens: number, window: string) => ({
  tokens,
  window,
}));
const limitMock = vi.fn();
const getRemainingMock = vi.fn();
const RatelimitMock = vi.fn(function (this: unknown) {
  Object.assign(this as object, { limit: limitMock, getRemaining: getRemainingMock });
});
(
  RatelimitMock as unknown as { slidingWindow: typeof slidingWindowMock }
).slidingWindow = slidingWindowMock;

vi.mock("@upstash/ratelimit", () => ({ Ratelimit: RatelimitMock }));

const { consumeQuota, peekQuota, FREE_TIER_MONTHLY_LIMIT } =
  await import("./quota");

beforeEach(() => {
  limitMock.mockReset();
  getRemainingMock.mockReset();
});

describe("quota module setup", () => {
  it("builds a sliding-window Ratelimit with the genora:quota prefix", () => {
    expect(slidingWindowMock).toHaveBeenCalledWith(
      FREE_TIER_MONTHLY_LIMIT,
      "30 d",
    );
    expect(RatelimitMock).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: "genora:quota" }),
    );
  });
});

describe("consumeQuota", () => {
  it("maps an allowed limiter response", async () => {
    limitMock.mockResolvedValue({
      success: true,
      remaining: 29,
      limit: 30,
      reset: 1_800_000_000_000,
    });

    const result = await consumeQuota("user-1");

    expect(limitMock).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      allowed: true,
      remaining: 29,
      limit: 30,
      resetAt: new Date(1_800_000_000_000),
    });
  });

  it("maps an exhausted limiter response", async () => {
    limitMock.mockResolvedValue({
      success: false,
      remaining: 0,
      limit: 30,
      reset: 1_800_000_000_000,
    });

    const result = await consumeQuota("user-2");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe("peekQuota", () => {
  it("derives allowed from remaining without consuming", async () => {
    getRemainingMock.mockResolvedValue({
      remaining: 5,
      limit: 30,
      reset: 1_800_000_000_000,
    });

    const result = await peekQuota("user-1");

    expect(getRemainingMock).toHaveBeenCalledWith("user-1");
    expect(limitMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      allowed: true,
      remaining: 5,
      limit: 30,
      resetAt: new Date(1_800_000_000_000),
    });
  });

  it("reports not allowed when remaining is zero", async () => {
    getRemainingMock.mockResolvedValue({
      remaining: 0,
      limit: 30,
      reset: 1_800_000_000_000,
    });

    const result = await peekQuota("user-2");

    expect(result.allowed).toBe(false);
  });
});
