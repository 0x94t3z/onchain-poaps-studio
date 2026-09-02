import { useQuery } from "@tanstack/react-query";

type MintCountResponse = {
  minted?: unknown;
  updatedAt?: unknown;
};

export function useMintCount(eventId: bigint, enabled = true) {
  return useQuery({
    queryKey: ["event-mint-count", eventId.toString()],
    enabled,
    retry: false,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/events/minted/${eventId.toString()}`, {
        signal,
      });
      const payload = (await response.json().catch(() => ({}))) as MintCountResponse;

      if (!response.ok) return null;
      return typeof payload.minted === "number" ? payload.minted : null;
    },
  });
}
