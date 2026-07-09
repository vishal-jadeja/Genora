import type { Platform } from "@/lib/generation/types";
import type { PlatformInstructionsRecord } from "@/lib/platformInstructions/service";
import type { UpsertPlatformInstructionsInput } from "@/lib/platformInstructions/schema";
import { api } from "./http";

export function listPlatformInstructions(): Promise<
  PlatformInstructionsRecord[]
> {
  return api.get<PlatformInstructionsRecord[]>("/api/platform-instructions");
}

export function savePlatformInstructions(
  platform: Platform,
  input: UpsertPlatformInstructionsInput,
): Promise<PlatformInstructionsRecord> {
  return api.put<PlatformInstructionsRecord>(
    `/api/platform-instructions/${platform}`,
    input,
  );
}

export function resetPlatformInstructions(
  platform: Platform,
): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/platform-instructions/${platform}`);
}
