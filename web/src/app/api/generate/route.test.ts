import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const runGenerateMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/generation/generateService", () => ({
  runGenerate: (...args: unknown[]) => runGenerateMock(...args),
  FolderNotOwnedError: class FolderNotOwnedError extends Error {},
}));

const { POST } = await import("./route");

const validBody = {
  rawText: "a genuinely substantive raw thought",
  platforms: [{ platform: "linkedin", modelId: "groq" }],
};

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  runGenerateMock.mockReset();
});

describe("POST /api/generate", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(401);
    expect(runGenerateMock).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed JSON", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: "{not-json",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when platforms is empty", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({ ...validBody, platforms: [] }),
      }),
    );

    expect(response.status).toBe(400);
    expect(runGenerateMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown model id", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({
          ...validBody,
          platforms: [{ platform: "linkedin", modelId: "made-up" }],
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(runGenerateMock).not.toHaveBeenCalled();
  });

  it("returns 422 with the reason on a slop guard rejection, without a job", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    runGenerateMock.mockResolvedValue({
      status: "rejected",
      slopGuard: { verdict: "hard_reject", reason: "too short" },
    });

    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.slopGuard).toEqual({
      verdict: "hard_reject",
      reason: "too short",
    });
  });

  it("returns 202 with the run info on success", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    runGenerateMock.mockResolvedValue({
      status: "accepted",
      postId: "post-1",
      runId: "run-1",
      publicAccessToken: "token",
      slopGuard: { verdict: "pass", reason: "" },
    });

    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({
      postId: "post-1",
      runId: "run-1",
      publicAccessToken: "token",
      slopGuard: { verdict: "pass", reason: "" },
    });
  });

  it("returns 400 when the folder isn't the user's", async () => {
    const { FolderNotOwnedError } =
      await import("@/lib/generation/generateService");
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    runGenerateMock.mockRejectedValue(new FolderNotOwnedError("folder-1"));

    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({ ...validBody, folderId: "folder-1" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
