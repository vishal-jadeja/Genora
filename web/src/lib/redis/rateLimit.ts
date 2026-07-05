import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./client";

type Window = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

export function createRateLimiter(opts: { tokens: number; window: Window }) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(opts.tokens, opts.window),
    prefix: "genora:ratelimit",
  });
}

export async function checkRateLimit(limiter: Ratelimit, identifier: string) {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { allowed: success, limit, remaining, reset };
}
