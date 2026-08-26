import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import {
  CREATED_EVENTS_QUERY_KEY,
  fetchCreatedEventIds,
} from "@/lib/created-events";

export function useCreatedEventIds(owner?: Address, enabled = true) {
  return useQuery({
    queryKey: [CREATED_EVENTS_QUERY_KEY, owner],
    enabled: Boolean(owner && enabled),
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: ({ signal }) => fetchCreatedEventIds(owner!, signal),
  });
}
