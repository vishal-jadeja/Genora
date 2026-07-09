"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { postDetailKey } from "./queryKeys";

export interface UseGenerationRunOptions {
  postId: string;
  runId: string | null;
  publicAccessToken: string | null;
}

export interface UseGenerationRunResult {
  // Whether the caller should fall back to polling usePost(postId) (pass a
  // refetchInterval) — true when a run is active but Realtime isn't
  // available (token missing/expired, e.g. revisiting a post later, or the
  // realtime subscription itself errored).
  shouldPoll: boolean;
  realtimeError: Error | undefined;
}

// Live status while a generation run is in flight, via Trigger.dev Realtime
// when a fresh publicAccessToken is available; falls back to polling
// otherwise. platform_outputs rows only appear once a platform finishes (no
// pre-inserted "pending" row — confirmed against persistResult.ts/
// generatePost.ts), so "still pending" is inferred by the caller as
// requested platforms minus platforms present in the post's
// platformOutputs, not tracked by this hook.
export function useGenerationRun({
  postId,
  runId,
  publicAccessToken,
}: UseGenerationRunOptions): UseGenerationRunResult {
  const queryClient = useQueryClient();
  const hasToken = !!runId && !!publicAccessToken;

  const { run, error } = useRealtimeRun(runId ?? undefined, {
    accessToken: publicAccessToken ?? undefined,
    enabled: hasToken,
  });

  useEffect(() => {
    if (!run) return;
    // Realtime pushes updates throughout the run, not just at completion —
    // refetch the post detail on every update so per-platform results
    // appear as they land.
    queryClient.invalidateQueries({ queryKey: postDetailKey(postId) });
  }, [run, postId, queryClient]);

  const runIsActive = !!runId && run?.status !== "COMPLETED" && run?.status !== "FAILED";

  return {
    shouldPoll: runIsActive && (!hasToken || !!error),
    realtimeError: error,
  };
}
