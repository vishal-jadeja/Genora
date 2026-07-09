import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPlatformInstructions,
  resetPlatformInstructions,
  savePlatformInstructions,
} from "@/lib/api/platformInstructions";
import { ORDER } from "@/lib/genora/data";
import type { Platform } from "@/lib/generation/types";
import { platformInstructionsKey } from "./queryKeys";

export function usePlatformInstructions() {
  return useQuery({
    queryKey: platformInstructionsKey,
    queryFn: listPlatformInstructions,
  });
}

export function useSaveInstructions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      platform,
      instructions,
    }: {
      platform: Platform;
      instructions: string;
    }) => savePlatformInstructions(platform, { instructions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformInstructionsKey });
    },
  });
}

export function useResetInstructions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (platform: Platform) => resetPlatformInstructions(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformInstructionsKey });
    },
  });
}

// The Settings "reset to defaults" action resets every platform at once —
// resetPlatformInstructions itself is per-platform (DELETE .../[platform]),
// so this composes one call per platform rather than needing a new endpoint.
export function useResetAllInstructions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      Promise.all(ORDER.map((platform) => resetPlatformInstructions(platform as Platform))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformInstructionsKey });
    },
  });
}
