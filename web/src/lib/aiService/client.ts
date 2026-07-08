export class AiServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function callAiService<TResponse>(
  path: string,
  body: unknown,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<TResponse> {
  const baseUrl = process.env.AI_SERVICE_URL;
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!baseUrl) throw new Error("AI_SERVICE_URL is not set");
  if (!secret) throw new Error("INTERNAL_SERVICE_SECRET is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AiServiceError(
        response.status,
        `ai-service ${path} failed: ${response.status} ${text}`,
      );
    }

    return (await response.json()) as TResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Kept >= 500 so callers' status < 500 vs >= 500 retry classification
      // (see generatePlatformPost.ts) still treats a timeout as transient,
      // unlike an auth/rate-limit failure.
      throw new AiServiceError(
        504,
        `ai-service ${path} timed out after ${timeoutMs}ms`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
