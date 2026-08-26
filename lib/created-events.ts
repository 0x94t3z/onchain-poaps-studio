export const CREATED_EVENTS_QUERY_KEY = "created-event-ids";

type CreatedEventsResponse = {
  eventIds?: unknown;
  error?: unknown;
};

export async function fetchCreatedEventIds(
  owner: `0x${string}`,
  signal?: AbortSignal,
) {
  let response: Response;

  try {
    response = await fetch(`/api/events/created/${owner}`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("Created POAPs could not be reached. Please try again.");
  }

  let payload: CreatedEventsResponse = {};
  try {
    payload = (await response.json()) as CreatedEventsResponse;
  } catch {
    // A proxy or development-server restart can return a non-JSON response.
  }

  if (!response.ok || !Array.isArray(payload.eventIds)) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Created POAPs could not be loaded. Please try again.",
    );
  }

  try {
    return payload.eventIds.map((eventId) => BigInt(String(eventId)));
  } catch {
    throw new Error("The created POAP response was invalid. Please try again.");
  }
}
