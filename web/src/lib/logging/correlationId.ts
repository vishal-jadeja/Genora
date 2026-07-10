export const CORRELATION_HEADER = "x-correlation-id";

// Trusts an inbound id if one is already present (e.g. a future
// frontend/CDN layer that mints its own), otherwise mints a fresh one — this
// is always the first hop for a generation run today (no upstream proxy
// sets it), but the fallback costs nothing and future-proofs the call site.
export function getOrCreateCorrelationId(request: Request): string {
  return request.headers.get(CORRELATION_HEADER) ?? crypto.randomUUID();
}
