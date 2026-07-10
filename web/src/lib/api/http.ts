export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const { error } = body as { error: unknown };
    if (typeof error === "string") return error;
    if (error) return JSON.stringify(error);
  }
  return fallback;
}

// Raw request that never throws on a non-2xx status — callers that need to
// treat a specific status as a normal outcome (e.g. POST /api/generate's 422
// slop-guard rejection) use this directly instead of the throwing helpers.
export async function requestRaw<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await parseBody(response)) as T;
  return { status: response.status, body };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { status, body } = await requestRaw<T>(path, init);
  if (status < 200 || status >= 300) {
    throw new ApiError(
      status,
      errorMessage(body, `request failed (${status})`),
      body,
    );
  }
  return body;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
