import { NextResponse } from "next/server";
import type { Logger } from "pino";
import { CORRELATION_HEADER } from "@/lib/logging/correlationId";

export interface ErrorMapping<E extends Error = Error> {
  test: new (...args: never[]) => E;
  status: number;
  message: (err: E) => string;
}

// Tries each mapping in order and returns the matching JSON response, or
// null if none match — callers fall through to internalErrorResponse() in
// that case. Additive on top of each module's existing typed-error classes
// (FolderNotOwnedError, PostNotFoundError, etc) — doesn't replace them.
export function handleKnownError(
  err: unknown,
  mappings: ErrorMapping[],
  log: Logger,
  correlationId: string,
): NextResponse | null {
  for (const mapping of mappings) {
    if (err instanceof mapping.test) {
      log.warn({ err }, mapping.test.name);
      return NextResponse.json(
        { error: mapping.message(err) },
        {
          status: mapping.status,
          headers: { [CORRELATION_HEADER]: correlationId },
        },
      );
    }
  }
  return null;
}

export function internalErrorResponse(
  correlationId: string,
  status = 500,
): NextResponse {
  return NextResponse.json(
    { error: "internal server error", correlationId },
    { status, headers: { [CORRELATION_HEADER]: correlationId } },
  );
}
