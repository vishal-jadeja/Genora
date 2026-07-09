import type { SlopGuardResult } from "@/lib/aiService/types";
import type { GeneratePostInput } from "@/lib/generation/schema";
import type { RegeneratePlatformInput } from "@/lib/generation/regenerateSchema";
import type { RunStatus } from "@/lib/generation/runStatus";
import type { Platform } from "@/lib/generation/types";
import type { PlatformOutputRow } from "@/lib/generation/persistResult";
import { api, ApiError, requestRaw } from "./http";

export type GenerateOutcome =
  | { status: "rejected"; slopGuard: SlopGuardResult }
  | {
      status: "accepted";
      postId: string;
      runId: string;
      publicAccessToken: string | null;
      slopGuard: SlopGuardResult;
    };

interface GenerateAcceptedBody {
  postId: string;
  runId: string;
  publicAccessToken: string | null;
  slopGuard: SlopGuardResult;
}
interface GenerateRejectedBody {
  error: "rejected";
  slopGuard: SlopGuardResult;
}

// 422 (slop guard hard-reject) is an expected outcome to render, not a
// thrown error — everything else uses the throwing api.* convention.
export async function generate(
  input: GeneratePostInput,
): Promise<GenerateOutcome> {
  const { status, body } = await requestRaw<
    GenerateAcceptedBody | GenerateRejectedBody
  >("/api/generate", { method: "POST", body: JSON.stringify(input) });

  if (status === 422) {
    return {
      status: "rejected",
      slopGuard: (body as GenerateRejectedBody).slopGuard,
    };
  }
  if (status < 200 || status >= 300) {
    const message =
      "error" in body && typeof body.error === "string"
        ? body.error
        : `generate failed (${status})`;
    throw new ApiError(status, message, body);
  }
  const accepted = body as GenerateAcceptedBody;
  return { status: "accepted", ...accepted };
}

export function getRunStatus(runId: string): Promise<RunStatus> {
  return api.get<RunStatus>(`/api/generate/${runId}`);
}

export function regeneratePlatform(
  postId: string,
  platform: Platform,
  input?: RegeneratePlatformInput,
): Promise<{ runId: string; publicAccessToken: string | null }> {
  return api.post<{ runId: string; publicAccessToken: string | null }>(
    `/api/posts/${postId}/platforms/${platform}/regenerate`,
    input ?? {},
  );
}

export function editPlatformContent(
  postId: string,
  platform: Platform,
  content: string,
): Promise<PlatformOutputRow> {
  return api.patch<PlatformOutputRow>(
    `/api/posts/${postId}/platforms/${platform}`,
    { content },
  );
}

export function listPlatformVersions(
  postId: string,
  platform: Platform,
): Promise<PlatformOutputRow[]> {
  return api.get<PlatformOutputRow[]>(
    `/api/posts/${postId}/platforms/${platform}/versions`,
  );
}

export function restorePlatformVersion(
  postId: string,
  platform: Platform,
  version: number,
): Promise<PlatformOutputRow> {
  return api.post<PlatformOutputRow>(
    `/api/posts/${postId}/platforms/${platform}/versions/${version}/restore`,
  );
}
