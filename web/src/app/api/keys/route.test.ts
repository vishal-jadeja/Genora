import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const listApiKeysMock = vi.fn();
const upsertApiKeyMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/keys/service", () => ({
  listApiKeys: (...args: unknown[]) => listApiKeysMock(...args),
  upsertApiKey: (...args: unknown[]) => upsertApiKeyMock(...args),
}));

const { GET, POST } = await import("./route");

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  listApiKeysMock.mockReset();
  upsertApiKeyMock.mockReset();
});

describe("GET /api/keys", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/keys"));

    expect(response.status).toBe(401);
  });

  it("returns the masked key list for an authenticated user", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    listApiKeysMock.mockResolvedValue([
      {
        provider: "anthropic",
        label: null,
        lastUsedAt: null,
        connected: false,
      },
    ]);

    const response = await GET(new Request("http://localhost/api/keys"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listApiKeysMock).toHaveBeenCalledWith("user-1");
    expect(body).toEqual([
      {
        provider: "anthropic",
        label: null,
        lastUsedAt: null,
        connected: false,
      },
    ]);
  });
});

describe("POST /api/keys", () => {
  it("returns 401 when there is no session", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/keys", {
        method: "POST",
        body: JSON.stringify({ provider: "anthropic", key: "sk-ant-x" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(upsertApiKeyMock).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed JSON instead of throwing", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost/api/keys", {
        method: "POST",
        body: "{not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(upsertApiKeyMock).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");

    const response = await POST(
      new Request("http://localhost/api/keys", {
        method: "POST",
        body: JSON.stringify({ provider: "not-a-real-provider", key: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(upsertApiKeyMock).not.toHaveBeenCalled();
  });

  it("upserts the key and returns the masked status on success", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    upsertApiKeyMock.mockResolvedValue(undefined);
    listApiKeysMock.mockResolvedValue([
      {
        provider: "anthropic",
        label: "work",
        lastUsedAt: null,
        connected: true,
      },
    ]);

    const response = await POST(
      new Request("http://localhost/api/keys", {
        method: "POST",
        body: JSON.stringify({
          provider: "anthropic",
          key: "sk-ant-x",
          label: "work",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(upsertApiKeyMock).toHaveBeenCalledWith(
      "user-1",
      "anthropic",
      "sk-ant-x",
      "work",
    );
    expect(body).toEqual({
      provider: "anthropic",
      label: "work",
      lastUsedAt: null,
      connected: true,
    });
  });
});
