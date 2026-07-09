import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, requestRaw } from "./http";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

describe("requestRaw", () => {
  it("never throws on a non-2xx status, returning status+body instead", async () => {
    fetchMock.mockResolvedValue(jsonResponse(422, { error: "rejected" }));

    const result = await requestRaw("/api/generate", { method: "POST" });

    expect(result).toEqual({ status: 422, body: { error: "rejected" } });
  });

  it("returns undefined body for an empty response", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await requestRaw("/api/folders/1");

    expect(result).toEqual({ status: 204, body: undefined });
  });
});

describe("api.get/post/patch/delete", () => {
  it("resolves with the parsed body on a 2xx response", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "f1" }));

    const result = await api.get<{ id: string }>("/api/folders/f1");

    expect(result).toEqual({ id: "f1" });
  });

  it("throws ApiError with the status and the response's error message on non-2xx", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse(404, { error: "Not found" })),
    );

    const failure = api.get("/api/posts/missing");
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure.catch((e) => e)).resolves.toMatchObject({
      status: 404,
      message: "Not found",
    });
  });

  it("falls back to a generic message when the error body has no string error field", async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: { fieldErrors: {} } }));

    await expect(api.post("/api/folders", { name: "" })).rejects.toMatchObject(
      { status: 400 },
    );
  });

  it("sends a JSON body and content-type header on post", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: "f1", name: "Work" }));

    await api.post("/api/folders", { name: "Work" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/folders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Work" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });
});
