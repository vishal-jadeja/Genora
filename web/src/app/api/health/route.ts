import { NextResponse } from "next/server";
import {
  CORRELATION_HEADER,
  getOrCreateCorrelationId,
} from "@/lib/logging/correlationId";

export function GET(request: Request) {
  const correlationId = getOrCreateCorrelationId(request);
  return NextResponse.json(
    { status: "ok" },
    { headers: { [CORRELATION_HEADER]: correlationId } },
  );
}
