import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const listPlatformInstructionsMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/platformInstructions/service", () => ({
  listPlatformInstructions: (...args: unknown[]) =>
    listPlatformInstructionsMock(...args),
}));

const { GET } = await import("./route");

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  listPlatformInstructionsMock.mockReset();
});

describe("GET /api/platform-instructions", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns the user's instructions per platform", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    listPlatformInstructionsMock.mockResolvedValue([
      { platform: "linkedin", instructions: "" },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(listPlatformInstructionsMock).toHaveBeenCalledWith("user-1");
    expect(body).toEqual([{ platform: "linkedin", instructions: "" }]);
  });
});
