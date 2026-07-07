import { describe, expect, it } from "vitest";
import { calculateCostUsd } from "./pricing";

describe("calculateCostUsd", () => {
  it("computes cost from prompt + completion tokens at the model's per-million rate", () => {
    // sonnet: $3/1M prompt, $15/1M completion
    const cost = calculateCostUsd("sonnet", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(18, 6);
  });

  it("returns 0 for zero tokens", () => {
    expect(calculateCostUsd("groq", 0, 0)).toBe(0);
  });

  it("scales linearly below 1M tokens", () => {
    const cost = calculateCostUsd("opus", 500_000, 0);
    expect(cost).toBeCloseTo(7.5, 6);
  });
});
