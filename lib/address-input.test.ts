import { describe, expect, it } from "vitest";
import type { Address } from "viem";
import { parseAddressEntries, resolveAddressEntries } from "./address-input";

const alice = "0x0000000000000000000000000000000000000001" as Address;
const bob = "0x0000000000000000000000000000000000000002" as Address;

describe("address and ENS input", () => {
  it("parses lines, commas, and semicolons", () => {
    expect(parseAddressEntries("alice.eth, bob.eth;\n0x123")).toEqual([
      "alice.eth",
      "bob.eth",
      "0x123",
    ]);
  });

  it("resolves ENS names and removes duplicate destination addresses", async () => {
    const result = await resolveAddressEntries(
      "alice.eth\nBOB.eth\nalice.eth",
      async (name) => (name.toLowerCase() === "alice.eth" ? alice : bob),
    );

    expect(result.addresses).toEqual([alice, bob]);
    expect(result.entryCount).toBe(2);
    expect(result.ensCount).toBe(2);
  });

  it("identifies the entry that could not be resolved", async () => {
    await expect(
      resolveAddressEntries("missing.eth", async () => {
        throw new Error("does not resolve");
      }),
    ).rejects.toThrow("missing.eth: does not resolve");
  });
});
