import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  editPlatformContent,
  generate,
  regeneratePlatform,
  restorePlatformVersion,
  listPlatformVersions,
} from "@/lib/api/generation";
import type { GeneratePostInput } from "@/lib/generation/schema";
import type { ModelId } from "@/lib/generation/modelCatalog";
import type { Platform } from "@/lib/generation/types";
import {
  platformVersionsKey,
  postDetailKey,
  postsRootKey,
  quotaKey,
} from "./queryKeys";

export function useGenerate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GeneratePostInput) => generate(input),
    onSuccess: (outcome) => {
      if (outcome.status === "accepted") {
        queryClient.invalidateQueries({ queryKey: postsRootKey });
        queryClient.invalidateQueries({ queryKey: quotaKey });
      }
    },
  });
}

// Used for both "retry" (a failed platform) and "regenerate" (a successful
// one) — the backend endpoint doesn't distinguish the two.
export function useRegeneratePlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      platform,
      modelId,
    }: {
      postId: string;
      platform: Platform;
      modelId?: ModelId;
    }) => regeneratePlatform(postId, platform, modelId ? { modelId } : undefined),
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postDetailKey(postId) });
      queryClient.invalidateQueries({ queryKey: quotaKey });
    },
  });
}

export function useEditPlatformContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      platform,
      content,
    }: {
      postId: string;
      platform: Platform;
      content: string;
    }) => editPlatformContent(postId, platform, content),
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postDetailKey(postId) });
    },
  });
}

export function usePlatformVersions(
  postId: string | undefined,
  platform: Platform | undefined,
) {
  return useQuery({
    queryKey: platformVersionsKey(postId ?? "", platform ?? "linkedin"),
    queryFn: () => listPlatformVersions(postId as string, platform as Platform),
    enabled: !!postId && !!platform,
  });
}

export function useRestoreVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      platform,
      version,
    }: {
      postId: string;
      platform: Platform;
      version: number;
    }) => restorePlatformVersion(postId, platform, version),
    onSuccess: (_data, { postId, platform }) => {
      queryClient.invalidateQueries({ queryKey: postDetailKey(postId) });
      queryClient.invalidateQueries({
        queryKey: platformVersionsKey(postId, platform),
      });
    },
  });
}
