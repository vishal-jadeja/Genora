import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const checkSlopGuardMock = vi.fn();
const createPostMock = vi.fn();
const setPostTriggerRunIdMock = vi.fn();
const triggerMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/generation/slopGuard", () => ({
  checkSlopGuard: (...args: unknown[]) => checkSlopGuardMock(...args),
}));

vi.mock("@/lib/posts/service", () => ({
  createPost: (...args: unknown[]) => createPostMock(...args),
  setPostTriggerRunId: (...args: unknown[]) => setPostTriggerRunIdMock(...args),
}));

vi.mock("@/trigger/generatePost", () => ({
  generatePost: { trigger: (...args: unknown[]) => triggerMock(...args) },
}));

const { POST } = await import("./route");

function requestWith(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  rawText: "a".repeat(100),
  platforms: [{ platform: "linkedin", modelId: "groq" }],
};

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  checkSlopGuardMock.mockReset();
  createPostMock.mockReset();
  setPostTriggerRunIdMock.mockReset();
  triggerMock.mockReset();
});

describe("POST /api/generate", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await POST(requestWith(validBody));

    expect(response.status).toBe(401);
    expect(checkSlopGuardMock).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(requestWith({ rawText: "" }));

    expect(response.status).toBe(400);
    expect(checkSlopGuardMock).not.toHaveBeenCalled();
  });

  it("rejects with 422 on a hard_reject verdict, without creating a post or a job", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    checkSlopGuardMock.mockResolvedValue({
      verdict: "hard_reject",
      reason: "too short",
    });

    const response = await POST(requestWith(validBody));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({ rejected: true, reason: "too short" });
    expect(createPostMock).not.toHaveBeenCalled();
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("creates a post, triggers a run, and persists the run id on a pass", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    checkSlopGuardMock.mockResolvedValue({ verdict: "pass", reason: "fine" });
    createPostMock.mockResolvedValue({ id: "post-1" });
    triggerMock.mockResolvedValue({ id: "run-1" });

    const response = await POST(requestWith(validBody));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(createPostMock).toHaveBeenCalledWith({
      userId: "user-1",
      rawContent: validBody.rawText,
      title: undefined,
      folderId: undefined,
    });
    expect(triggerMock).toHaveBeenCalledWith({
      postId: "post-1",
      userId: "user-1",
      rawText: validBody.rawText,
      platforms: validBody.platforms,
    });
    expect(setPostTriggerRunIdMock).toHaveBeenCalledWith("post-1", "run-1");
    expect(body).toEqual({
      postId: "post-1",
      runId: "run-1",
      slopGuard: { verdict: "pass", reason: "fine" },
    });
  });

  it("proceeds through on a soft_nudge verdict, same as a pass", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    checkSlopGuardMock.mockResolvedValue({
      verdict: "soft_nudge",
      reason: "a bit thin",
    });
    createPostMock.mockResolvedValue({ id: "post-1" });
    triggerMock.mockResolvedValue({ id: "run-1" });

    const response = await POST(requestWith(validBody));

    expect(response.status).toBe(202);
    expect(createPostMock).toHaveBeenCalled();
  });
});
