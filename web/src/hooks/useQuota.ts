import { useQuery } from "@tanstack/react-query";
import { getQuota } from "@/lib/api/quota";
import { quotaKey } from "./queryKeys";

export function useQuota() {
  return useQuery({ queryKey: quotaKey, queryFn: getQuota });
}
