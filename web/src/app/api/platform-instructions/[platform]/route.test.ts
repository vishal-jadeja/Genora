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

const { PUT, DELETE } = await import("./route");

function ctx(platform: string) {
  return { params: Promise.resolve({ platform }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  upsertPlatformInstructionsMock.mockReset();
  deletePlatformInstructionsMock.mockReset();
});

describe("PUT /api/platform-instructions/[platform]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ instructions: "Be terse" }),
      }),
      ctx("linkedin"),
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for a platform not in the enum", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ instructions: "Be terse" }),
      }),
      ctx("not-a-real-platform"),
    );

    expect(response.status).toBe(400);
    expect(upsertPlatformInstructionsMock).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ instructions: "" }),
      }),
      ctx("linkedin"),
    );

    expect(response.status).toBe(400);
    expect(upsertPlatformInstructionsMock).not.toHaveBeenCalled();
  });

  it("upserts and returns the record", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    upsertPlatformInstructionsMock.mockResolvedValue({
      platform: "linkedin",
      instructions: "Be terse",
    });

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ instructions: "Be terse" }),
      }),
      ctx("linkedin"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(upsertPlatformInstructionsMock).toHaveBeenCalledWith(
      "user-1",
      "linkedin",
      "Be terse",
    );
    expect(body).toEqual({ platform: "linkedin", instructions: "Be terse" });
  });
});

describe("DELETE /api/platform-instructions/[platform]", () => {
  it("returns 400 for a platform not in the enum", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await DELETE(
      new Request("http://localhost"),
      ctx("not-a-real-platform"),
    );

    expect(response.status).toBe(400);
    expect(deletePlatformInstructionsMock).not.toHaveBeenCalled();
  });

  it("deletes the instructions", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    deletePlatformInstructionsMock.mockResolvedValue(undefined);

    const response = await DELETE(
      new Request("http://localhost"),
      ctx("linkedin"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(deletePlatformInstructionsMock).toHaveBeenCalledWith(
      "user-1",
      "linkedin",
    );
  });
});
