import { beforeEach, describe, expect, it, vi } from "vitest";

const retrieveMock = vi.fn();

vi.mock("@trigger.dev/sdk", () => ({
  runs: {
    retrieve: (...args: unknown[]) => retrieveMock(...args),
  },
  NotFoundError: class NotFoundError extends Error {},
}));

const { getRunStatus, RunAccessError } = await import("./runStatus");

beforeEach(() => {
  retrieveMock.mockReset();
});

describe("getRunStatus", () => {
  it("throws RunAccessError (not a raw 500) when the run id doesn't exist", async () => {
    const { NotFoundError } = await import("@trigger.dev/sdk");
    const MockNotFoundError = NotFoundError as unknown as new (
      message?: string,
    ) => Error;
    retrieveMock.mockRejectedValue(new MockNotFoundError("no such run"));

    await expect(getRunStatus("user-1", "missing")).rejects.toThrow(
      RunAccessError,
    );
  });

  it("throws RunAccessError when the run isn't tagged for this user", async () => {
    retrieveMock.mockResolvedValue({
      id: "run-1",
      status: "COMPLETED",
      tags: ["user:someone-else"],
    });

    await expect(getRunStatus("user-1", "run-1")).rejects.toThrow(
      RunAccessError,
    );
  });

  it("throws RunAccessError when the run has no tags", async () => {
    retrieveMock.mockResolvedValue({ id: "run-1", status: "COMPLETED" });

    await expect(getRunStatus("user-1", "run-1")).rejects.toThrow(
      RunAccessError,
    );
  });

  it("returns status, output, and error for a run owned by the user", async () => {
    retrieveMock.mockResolvedValue({
      id: "run-1",
      status: "COMPLETED",
      tags: ["user:user-1"],
      output: { results: [{ platform: "linkedin", status: "success" }] },
      error: undefined,
    });

    const result = await getRunStatus("user-1", "run-1");

    expect(result).toEqual({
      id: "run-1",
      status: "COMPLETED",
      output: { results: [{ platform: "linkedin", status: "success" }] },
      error: undefined,
    });
  });

  it("maps a run error to a plain message", async () => {
    retrieveMock.mockResolvedValue({
      id: "run-1",
      status: "FAILED",
      tags: ["user:user-1"],
      output: undefined,
      error: { message: "boom" },
    });

    const result = await getRunStatus("user-1", "run-1");

    expect(result.error).toEqual({ message: "boom" });
  });
});
