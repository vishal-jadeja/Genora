import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const getRunStatusMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/generation/runStatus", () => ({
  getRunStatus: (...args: unknown[]) => getRunStatusMock(...args),
  RunAccessError: class RunAccessError extends Error {},
}));

const { GET } = await import("./route");

function ctx(runId: string) {
  return { params: Promise.resolve({ runId }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  getRunStatusMock.mockReset();
});

describe("GET /api/generate/[runId]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), ctx("run-1"));

    expect(response.status).toBe(401);
    expect(getRunStatusMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the run doesn't belong to the user", async () => {
    const { RunAccessError } = await import("@/lib/generation/runStatus");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getRunStatusMock.mockRejectedValue(new RunAccessError("nope"));

    const response = await GET(new Request("http://localhost"), ctx("run-1"));

    expect(response.status).toBe(404);
  });

  it("returns the run status on success", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getRunStatusMock.mockResolvedValue({
      id: "run-1",
      status: "COMPLETED",
      output: { results: [] },
      error: undefined,
    });

    const response = await GET(new Request("http://localhost"), ctx("run-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getRunStatusMock).toHaveBeenCalledWith("user-1", "run-1");
    expect(body).toEqual({
      id: "run-1",
      status: "COMPLETED",
      output: { results: [] },
      error: undefined,
    });
  });
});
