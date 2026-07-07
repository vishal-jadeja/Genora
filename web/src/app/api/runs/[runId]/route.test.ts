import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const getPostByTriggerRunIdMock = vi.fn();
const retrieveMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/posts/service", () => ({
  getPostByTriggerRunId: (...args: unknown[]) =>
    getPostByTriggerRunIdMock(...args),
}));

vi.mock("@trigger.dev/sdk", () => ({
  runs: { retrieve: (...args: unknown[]) => retrieveMock(...args) },
}));

const { GET } = await import("./route");

function ctxFor(runId: string) {
  return { params: Promise.resolve({ runId }) };
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  getPostByTriggerRunIdMock.mockReset();
  retrieveMock.mockReset();
});

describe("GET /api/runs/[runId]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost"),
      ctxFor("run-1"),
    );

    expect(response.status).toBe(401);
    expect(getPostByTriggerRunIdMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a run id that doesn't belong to the requesting user, without ever calling Trigger.dev", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("attacker");
    getPostByTriggerRunIdMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost"),
      ctxFor("run-1"),
    );

    expect(response.status).toBe(404);
    expect(retrieveMock).not.toHaveBeenCalled();
  });

  it("returns run status for a run id owned by the requesting user", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getPostByTriggerRunIdMock.mockResolvedValue({ id: "post-1" });
    retrieveMock.mockResolvedValue({
      id: "run-1",
      status: "COMPLETED",
      isCompleted: true,
      isSuccess: true,
      isFailed: false,
      output: { results: [] },
    });

    const response = await GET(
      new Request("http://localhost"),
      ctxFor("run-1"),
    );
    const body = await response.json();

    expect(getPostByTriggerRunIdMock).toHaveBeenCalledWith("user-1", "run-1");
    expect(body).toEqual({
      id: "run-1",
      status: "COMPLETED",
      isCompleted: true,
      isSuccess: true,
      isFailed: false,
      output: { results: [] },
    });
  });
});
