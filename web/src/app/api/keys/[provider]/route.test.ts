import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const deleteApiKeyMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/keys/service", () => ({
  deleteApiKey: (...args: unknown[]) => deleteApiKeyMock(...args),
}));

const { DELETE } = await import("./route");

function ctx(provider: string) {
  return { params: Promise.resolve({ provider }) } as never;
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  deleteApiKeyMock.mockReset();
});

describe("DELETE /api/keys/[provider]", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost"),
      ctx("anthropic"),
    );

    expect(response.status).toBe(401);
    expect(deleteApiKeyMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a provider not in the enum", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await DELETE(
      new Request("http://localhost"),
      ctx("not-a-real-provider"),
    );

    expect(response.status).toBe(400);
    expect(deleteApiKeyMock).not.toHaveBeenCalled();
  });

  it("deletes the key for a valid provider", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    deleteApiKeyMock.mockResolvedValue(undefined);

    const response = await DELETE(
      new Request("http://localhost"),
      ctx("anthropic"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(deleteApiKeyMock).toHaveBeenCalledWith("user-1", "anthropic");
  });
});
