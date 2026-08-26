export function createdEventIdsFromLogs(logs: unknown[]) {
  const ids = new Set<bigint>();

  for (const log of logs) {
    if (!log || typeof log !== "object" || !("topics" in log)) continue;
    const topics = (log as { topics?: unknown }).topics;
    if (!Array.isArray(topics) || typeof topics[1] !== "string") continue;

    try {
      ids.add(BigInt(topics[1]));
    } catch {
      // Ignore malformed explorer entries instead of failing the whole view.
    }
  }

  return [...ids].sort((first, second) =>
    first === second ? 0 : first > second ? -1 : 1,
  );
}

export function hasPartialContractResults(
  results?: Array<{ status: "success" | "failure" }>,
) {
  return results?.some((result) => result.status === "failure") ?? false;
}
