import { beforeEach, describe, expect, it, vi } from "vitest";

const callAiServiceMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const triggerMock = vi.fn();
const createPublicTokenMock = vi.fn();
const folderBelongsToUserMock = vi.fn();
const getPostMock = vi.fn();

vi.mock("@/lib/aiService/client", () => ({
  callAiService: (...args: unknown[]) => callAiServiceMock(...args),
}));

vi.mock("@/lib/folders/service", () => ({
  folderBelongsToUser: (...args: unknown[]) => folderBelongsToUserMock(...args),
}));

vi.mock("@/lib/posts/service", () => ({
  getPost: (...args: unknown[]) => getPostMock(...args),
  PostNotFoundError: class PostNotFoundError extends Error {},
}));

vi.mock("@/db/client", () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

vi.mock("../../../trigger/generatePost", () => ({
  generatePost: {
    trigger: (...args: unknown[]) => triggerMock(...args),
  },
}));

vi.mock("@trigger.dev/sdk", () => ({
  auth: {
    createPublicToken: (...args: unknown[]) => createPublicTokenMock(...args),
  },
}));

const {
  runGenerate,
  regeneratePlatform,
  FolderNotOwnedError,
  SlopGuardUnavailableError,
  ModelRequiredError,
} = await import("./generateService");

const validInput = {
  rawText: "a genuinely substantive raw thought",
  platforms: [{ platform: "linkedin" as const, modelId: "groq" as const }],
};

beforeEach(() => {
  callAiServiceMock.mockReset();
  insertMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
  triggerMock.mockReset();
  createPublicTokenMock.mockReset();
  folderBelongsToUserMock.mockReset();
  getPostMock.mockReset();
});

describe("runGenerate", () => {
  it("returns rejected without creating a post or triggering a job on hard_reject", async () => {
    callAiServiceMock.mockResolvedValue({
      verdict: "hard_reject",
      reason: "too short",
    });

    const result = await runGenerate("user-1", validInput, "corr-1");

    expect(result).toEqual({
      status: "rejected",
      slopGuard: { verdict: "hard_reject", reason: "too short" },
    });
    expect(insertMock).not.toHaveBeenCalled();
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("proceeds on soft_nudge, creating a post and triggering the job", async () => {
    callAiServiceMock.mockResolvedValue({
      verdict: "soft_nudge",
      reason: "could use more detail",
    });
    const returning = vi.fn().mockResolvedValue([{ id: "post-1" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });
    triggerMock.mockResolvedValue({ id: "run-1" });
    createPublicTokenMock.mockResolvedValue("public-token");

    const result = await runGenerate("user-1", validInput, "corr-1");

    expect(triggerMock).toHaveBeenCalledWith(
      {
        postId: "post-1",
        userId: "user-1",
        rawText: validInput.rawText,
        platforms: validInput.platforms,
        correlationId: "corr-1",
      },
      { tags: ["user:user-1"] },
    );
    expect(createPublicTokenMock).toHaveBeenCalledWith({
      scopes: { read: { runs: ["run-1"] } },
      expirationTime: "1h",
    });
    expect(result).toEqual({
      status: "accepted",
      postId: "post-1",
      runId: "run-1",
      publicAccessToken: "public-token",
      slopGuard: { verdict: "soft_nudge", reason: "could use more detail" },
    });
  });

  it("proceeds on pass", async () => {
    callAiServiceMock.mockResolvedValue({ verdict: "pass", reason: "" });
    const returning = vi.fn().mockResolvedValue([{ id: "post-1" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });
    triggerMock.mockResolvedValue({ id: "run-1" });
    createPublicTokenMock.mockResolvedValue("public-token");

    const result = await runGenerate("user-1", validInput, "corr-1");

    expect(result.status).toBe("accepted");
  });

  it("throws FolderNotOwnedError without calling slop guard when the folder isn't the user's", async () => {
    folderBelongsToUserMock.mockResolvedValue(false);

    await expect(
      runGenerate("user-1", { ...validInput, folderId: "folder-1" }, "corr-1"),
    ).rejects.toThrow(FolderNotOwnedError);
    expect(callAiServiceMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("proceeds when the folder belongs to the user", async () => {
    folderBelongsToUserMock.mockResolvedValue(true);
    callAiServiceMock.mockResolvedValue({ verdict: "pass", reason: "" });
    const returning = vi.fn().mockResolvedValue([{ id: "post-1" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });
    triggerMock.mockResolvedValue({ id: "run-1" });
    createPublicTokenMock.mockResolvedValue("public-token");

    const result = await runGenerate(
      "user-1",
      { ...validInput, folderId: "folder-1" },
      "corr-1",
    );

    expect(folderBelongsToUserMock).toHaveBeenCalledWith("user-1", "folder-1");
    expect(result.status).toBe("accepted");
  });

  it("deletes the orphaned post row and rethrows when trigger() fails", async () => {
    callAiServiceMock.mockResolvedValue({ verdict: "pass", reason: "" });
    const returning = vi.fn().mockResolvedValue([{ id: "post-1" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    deleteMock.mockReturnValue({ where: deleteWhere });
    triggerMock.mockRejectedValue(new Error("trigger.dev unavailable"));

    await expect(runGenerate("user-1", validInput, "corr-1")).rejects.toThrow(
      "trigger.dev unavailable",
    );
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(createPublicTokenMock).not.toHaveBeenCalled();
  });

  it("degrades to publicAccessToken: null instead of throwing when createPublicToken fails", async () => {
    callAiServiceMock.mockResolvedValue({ verdict: "pass", reason: "" });
    const returning = vi.fn().mockResolvedValue([{ id: "post-1" }]);
    const values = vi.fn().mockReturnValue({ returning });
    insertMock.mockReturnValue({ values });
    triggerMock.mockResolvedValue({ id: "run-1" });
    createPublicTokenMock.mockRejectedValue(new Error("token service down"));

    const result = await runGenerate("user-1", validInput, "corr-1");

    expect(result).toEqual({
      status: "accepted",
      postId: "post-1",
      runId: "run-1",
      publicAccessToken: null,
      slopGuard: { verdict: "pass", reason: "" },
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("throws SlopGuardUnavailableError without creating a post when the slop guard call fails", async () => {
    callAiServiceMock.mockRejectedValue(new Error("network error"));

    await expect(runGenerate("user-1", validInput, "corr-1")).rejects.toThrow(
      SlopGuardUnavailableError,
    );
    expect(insertMock).not.toHaveBeenCalled();
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("updates the existing post in place instead of inserting when postId is given", async () => {
    callAiServiceMock.mockResolvedValue({ verdict: "pass", reason: "" });
    getPostMock.mockResolvedValue({ id: "post-1" });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });
    triggerMock.mockResolvedValue({ id: "run-1" });
    createPublicTokenMock.mockResolvedValue("public-token");

    const result = await runGenerate(
      "user-1",
      { ...validInput, postId: "post-1", title: "Reworked" },
      "corr-1",
    );

    expect(getPostMock).toHaveBeenCalledWith("user-1", "post-1");
    expect(insertMock).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        rawContent: validInput.rawText,
        title: "Reworked",
        folderId: null,
      }),
    );
    expect(triggerMock).toHaveBeenCalledWith(
      expect.objectContaining({ postId: "post-1" }),
      expect.anything(),
    );
    expect(result).toEqual({
      status: "accepted",
      postId: "post-1",
      runId: "run-1",
      publicAccessToken: "public-token",
      slopGuard: { verdict: "pass", reason: "" },
    });
  });

  it("propagates PostNotFoundError without inserting or updating when postId isn't owned by the user", async () => {
    const { PostNotFoundError } = await import("@/lib/posts/service");
    callAiServiceMock.mockResolvedValue({ verdict: "pass", reason: "" });
    getPostMock.mockRejectedValue(new PostNotFoundError("post-1"));

    await expect(
      runGenerate("user-1", { ...validInput, postId: "post-1" }, "corr-1"),
    ).rejects.toThrow(PostNotFoundError);
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("does not delete the pre-existing post when trigger() fails for a given postId", async () => {
    callAiServiceMock.mockResolvedValue({ verdict: "pass", reason: "" });
    getPostMock.mockResolvedValue({ id: "post-1" });
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    updateMock.mockReturnValue({ set });
    triggerMock.mockRejectedValue(new Error("trigger.dev unavailable"));

    await expect(
      runGenerate("user-1", { ...validInput, postId: "post-1" }, "corr-1"),
    ).rejects.toThrow("trigger.dev unavailable");
    expect(deleteMock).not.toHaveBeenCalled();
  });
});

describe("regeneratePlatform", () => {
  it("uses the given modelId and triggers a single-platform run", async () => {
    getPostMock.mockResolvedValue({
      id: "post-1",
      rawContent: "a genuinely substantive raw thought",
      platformOutputs: [],
    });
    triggerMock.mockResolvedValue({ id: "run-1" });
    createPublicTokenMock.mockResolvedValue("public-token");

    const result = await regeneratePlatform(
      "user-1",
      "post-1",
      "linkedin",
      "groq",
      "corr-1",
    );

    expect(triggerMock).toHaveBeenCalledWith(
      {
        postId: "post-1",
        userId: "user-1",
        rawText: "a genuinely substantive raw thought",
        platforms: [{ platform: "linkedin", modelId: "groq" }],
        correlationId: "corr-1",
      },
      { tags: ["user:user-1"] },
    );
    expect(result).toEqual({
      runId: "run-1",
      publicAccessToken: "public-token",
    });
  });

  it("infers modelId from the current platform_outputs row when none is given", async () => {
    getPostMock.mockResolvedValue({
      id: "post-1",
      rawContent: "a genuinely substantive raw thought",
      platformOutputs: [{ platform: "linkedin", model: "openai/gpt-oss-120b" }],
    });
    triggerMock.mockResolvedValue({ id: "run-1" });
    createPublicTokenMock.mockResolvedValue("public-token");

    await regeneratePlatform(
      "user-1",
      "post-1",
      "linkedin",
      undefined,
      "corr-1",
    );

    expect(triggerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        platforms: [{ platform: "linkedin", modelId: "groq" }],
      }),
      expect.anything(),
    );
  });

  it("throws ModelRequiredError when no modelId is given and there's no prior output for that platform", async () => {
    getPostMock.mockResolvedValue({
      id: "post-1",
      rawContent: "a genuinely substantive raw thought",
      platformOutputs: [],
    });

    await expect(
      regeneratePlatform("user-1", "post-1", "linkedin", undefined, "corr-1"),
    ).rejects.toThrow(ModelRequiredError);
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("propagates PostNotFoundError from getPost", async () => {
    const { PostNotFoundError } = await import("@/lib/posts/service");
    getPostMock.mockRejectedValue(new PostNotFoundError("post-1"));

    await expect(
      regeneratePlatform("user-1", "post-1", "linkedin", "groq", "corr-1"),
    ).rejects.toThrow(PostNotFoundError);
  });
});
