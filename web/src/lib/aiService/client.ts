export class AiServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

export async function callAiService<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const baseUrl = process.env.AI_SERVICE_URL;
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!baseUrl) throw new Error("AI_SERVICE_URL is not set");
  if (!secret) throw new Error("INTERNAL_SERVICE_SECRET is not set");

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": secret,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AiServiceError(
      response.status,
      `ai-service ${path} failed: ${response.status} ${text}`,
    );
  }

  return (await response.json()) as TResponse;
}
