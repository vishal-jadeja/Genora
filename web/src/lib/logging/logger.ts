import pino from "pino";

// Redact anything that could leak a secret or BYOK key into logs, even if a
// caller accidentally passes a whole object as log context.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "headers['x-internal-secret']",
      "req.headers['x-internal-secret']",
      "apiKey",
      "*.apiKey",
      "encryptedKey",
      "*.encryptedKey",
      "authTag",
      "*.authTag",
    ],
    censor: "[redacted]",
  },
});

export function createRequestLogger(
  correlationId: string,
  bindings: Record<string, unknown> = {},
): pino.Logger {
  return logger.child({ correlationId, ...bindings });
}
