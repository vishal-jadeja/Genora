import { callAiService } from "@/lib/aiService/client";

// Mirrors ai-service/app/schemas/slop_guard.py
export type SlopGuardVerdict = "pass" | "soft_nudge" | "hard_reject";

export interface SlopGuardResult {
  verdict: SlopGuardVerdict;
  reason: string;
}

export async function checkSlopGuard(
  rawText: string,
): Promise<SlopGuardResult> {
  return callAiService<SlopGuardResult>("/slop-guard", { raw_text: rawText });
}
