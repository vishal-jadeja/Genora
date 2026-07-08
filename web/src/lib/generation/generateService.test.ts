import { beforeEach, describe, expect, it, vi } from "vitest";

const callAiServiceMock = vi.fn();
const insertMock = vi.fn();
const triggerMock = vi.fn();
const createPublicTokenMock = vi.fn();
const folderBelongsToUserMock = vi.fn();

vi.mock("@/lib/aiService/client", () => ({
  callAiService: (...args: unknown[]) => callAiServiceMock(...args),
}));

vi.mock("@/lib/folders/service", () => ({
  folderBelongsToUser: (...args: unknown[]) => folderBelongsToUserMock(...args),
}));

vi.mock("@/db/client", () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
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

const { runGenerate, FolderNotOwnedError } = await import("./generateService");

const validInput = {
  rawText: "a genuinely substantive raw thought",
  platforms: [{ platform: "linkedin" as const, modelId: "groq" as const }],
};

beforeEach(() => {
  callAiServiceMock.mockReset();
  insertMock.mockReset();
  triggerMock.mockReset();
  createPublicTokenMock.mockReset();
  folderBelongsToUserMock.mockReset();
});

describe("runGenerate", () => {
  it("returns rejected without creating a post or triggering a job on hard_reject", async () => {
    callAiServiceMock.mockResolvedValue({
      verdict: "hard_reject",
      reason: "too short",
    });

    const result = await runGenerate("user-1", validInput);

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

    const result = await runGenerate("user-1", validInput);

    expect(triggerMock).toHaveBeenCalledWith(
      {
        postId: "post-1",
        userId: "user-1",
        rawText: validInput.rawText,
        platforms: validInput.platforms,
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

    const result = await runGenerate("user-1", validInput);

    expect(result.status).toBe("accepted");
  });

  it("throws FolderNotOwnedError without calling slop guard when the folder isn't the user's", async () => {
    folderBelongsToUserMock.mockResolvedValue(false);

    await expect(
      runGenerate("user-1", { ...validInput, folderId: "folder-1" }),
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

    const result = await runGenerate("user-1", {
      ...validInput,
      folderId: "folder-1",
    });

    expect(folderBelongsToUserMock).toHaveBeenCalledWith("user-1", "folder-1");
    expect(result.status).toBe("accepted");
  });
});
