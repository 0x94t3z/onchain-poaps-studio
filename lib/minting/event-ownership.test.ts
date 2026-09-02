import { describe, expect, it } from "vitest";
import {
  createdEventIdsFromLogs,
  hasPartialContractResults,
} from "./event-ownership";

describe("createdEventIdsFromLogs", () => {
  it("returns unique event IDs in newest-first order", () => {
    expect(
      createdEventIdsFromLogs([
        { topics: ["0x01", "0x07"] },
        { topics: ["0x01", "0x0f"] },
        { topics: ["0x01", "0x07"] },
      ]),
    ).toEqual([15n, 7n]);
  });

  it("ignores malformed and incomplete logs", () => {
    expect(
      createdEventIdsFromLogs([
        {},
        { topics: ["0x01", null] },
        { topics: ["0x01", "not-hex" as `0x${string}`] },
      ]),
    ).toEqual([]);
  });
});

describe("hasPartialContractResults", () => {
  it("detects an individual failed contract read", () => {
    expect(
      hasPartialContractResults([
        { status: "success" },
        { status: "failure" },
      ]),
    ).toBe(true);
  });

  it("accepts complete or absent results", () => {
    expect(hasPartialContractResults([{ status: "success" }])).toBe(false);
    expect(hasPartialContractResults()).toBe(false);
  });
});
