import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCreatedEventIds } from "./created-events";

const owner = "0x0000000000000000000000000000000000000001" as const;

afterEach(() => vi.unstubAllGlobals());

describe("fetchCreatedEventIds", () => {
  it("parses created event IDs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ eventIds: ["15", "7"] }), {
          status: 200,
        }),
      ),
    );

    await expect(fetchCreatedEventIds(owner)).resolves.toEqual([15n, 7n]);
  });

  it("turns a network failure into a stable user-facing error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(fetchCreatedEventIds(owner)).rejects.toThrow(
      "Created POAPs could not be reached. Please try again.",
    );
  });

  it("handles non-JSON error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })),
    );

    await expect(fetchCreatedEventIds(owner)).rejects.toThrow(
      "Created POAPs could not be loaded. Please try again.",
    );
  });
});
