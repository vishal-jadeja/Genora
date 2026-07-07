import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedUserIdMock = vi.fn();
const getPostOutputsMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUserId: () => getAuthenticatedUserIdMock(),
}));

vi.mock("@/lib/posts/service", () => ({
  getPostOutputs: (...args: unknown[]) => getPostOutputsMock(...args),
}));

const { GET } = await import("./route");

function ctxFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  getAuthenticatedUserIdMock.mockReset();
  getPostOutputsMock.mockReset();
});

describe("GET /api/posts/[id]/outputs", () => {
  it("returns 404 when the post isn't owned by the user", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getPostOutputsMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), ctxFor("p1"));

    expect(response.status).toBe(404);
  });

  it("returns the current outputs for the post", async () => {
    getAuthenticatedUserIdMock.mockResolvedValue("user-1");
    getPostOutputsMock.mockResolvedValue([{ platform: "linkedin" }]);

    const response = await GET(new Request("http://localhost"), ctxFor("p1"));
    const body = await response.json();

    expect(body).toEqual([{ platform: "linkedin" }]);
  });
});
