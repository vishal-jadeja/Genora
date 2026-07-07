import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const upsertPlatformInstructionsMock = vi.fn();
const deletePlatformInstructionsMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/platformInstructions/service", () => ({
  upsertPlatformInstructions: (...args: unknown[]) =>
    upsertPlatformInstructionsMock(...args),
  deletePlatformInstructions: (...args: unknown[]) =>
    deletePlatformInstructionsMock(...args),
}));

const { DELETE, PUT } = await import("./route");

function ctxFor(platform: string) {
  return { params: Promise.resolve({ platform }) };
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  upsertPlatformInstructionsMock.mockReset();
  deletePlatformInstructionsMock.mockReset();
});

describe("PUT /api/platform-instructions/[platform]", () => {
  it("returns 400 for an invalid platform", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ instructions: "Be punchy." }),
      }),
      ctxFor("not-a-platform"),
    );

    expect(response.status).toBe(400);
    expect(upsertPlatformInstructionsMock).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({}),
      }),
      ctxFor("linkedin"),
    );

    expect(response.status).toBe(400);
    expect(upsertPlatformInstructionsMock).not.toHaveBeenCalled();
  });

  it("upserts the instructions for a valid platform", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ instructions: "Be punchy." }),
      }),
      ctxFor("linkedin"),
    );
    const body = await response.json();

    expect(upsertPlatformInstructionsMock).toHaveBeenCalledWith(
      "user-1",
      "linkedin",
      "Be punchy.",
    );
    expect(body).toEqual({ platform: "linkedin", instructions: "Be punchy." });
  });
});

describe("DELETE /api/platform-instructions/[platform]", () => {
  it("returns 400 for an invalid platform", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await DELETE(
      new Request("http://localhost"),
      ctxFor("bogus"),
    );

    expect(response.status).toBe(400);
    expect(deletePlatformInstructionsMock).not.toHaveBeenCalled();
  });

  it("resets the instructions for a valid platform", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await DELETE(
      new Request("http://localhost"),
      ctxFor("linkedin"),
    );
    const body = await response.json();

    expect(deletePlatformInstructionsMock).toHaveBeenCalledWith(
      "user-1",
      "linkedin",
    );
    expect(body).toEqual({ ok: true });
  });
});
