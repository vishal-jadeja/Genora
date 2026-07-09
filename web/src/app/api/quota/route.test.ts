import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const peekQuotaMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/redis/quota", () => ({
  peekQuota: (...args: unknown[]) => peekQuotaMock(...args),
}));

const { GET } = await import("./route");

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  peekQuotaMock.mockReset();
});

describe("GET /api/quota", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(peekQuotaMock).not.toHaveBeenCalled();
  });

  it("returns the peeked quota for the authenticated user", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    peekQuotaMock.mockResolvedValue({
      allowed: true,
      remaining: 12,
      limit: 30,
      resetAt: new Date("2026-08-01T00:00:00.000Z"),
    });

    const response = await GET();
    const body = await response.json();

    expect(peekQuotaMock).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
    expect(body).toEqual({
      allowed: true,
      remaining: 12,
      limit: 30,
      resetAt: "2026-08-01T00:00:00.000Z",
    });
  });
});
