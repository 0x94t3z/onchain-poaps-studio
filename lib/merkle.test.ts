import { describe, expect, it } from "vitest";
import { getAddress } from "viem";
import { buildTree, normalizeAddresses, verifyProof } from "./merkle";

describe("allowlist builder", () => {
  it("normalizes and deduplicates addresses", () => {
    const address = "0x0000000000000000000000000000000000000001";
    expect(normalizeAddresses(`${address}\n${address}`)).toEqual([
      getAddress(address),
    ]);
  });

  it("creates and verifies a proof per address", () => {
    const addresses = normalizeAddresses(
      "0x0000000000000000000000000000000000000001\n0x0000000000000000000000000000000000000002\n0x0000000000000000000000000000000000000003",
    );
    const tree = buildTree(addresses);

    expect(tree.root).toMatch(/^0x[0-9a-f]{64}$/);
    expect(tree.entries).toHaveLength(3);
    expect(tree.proofFor(addresses[0]).length).toBeGreaterThan(0);
    for (const address of addresses) {
      expect(verifyProof(address, tree.proofFor(address), tree.root)).toBe(true);
    }
  });

  it("rejects another wallet and malformed proof data", () => {
    const addresses = normalizeAddresses(
      "0x0000000000000000000000000000000000000001\n0x0000000000000000000000000000000000000002",
    );
    const outsider = getAddress(
      "0x0000000000000000000000000000000000000003",
    );
    const tree = buildTree(addresses);

    expect(verifyProof(outsider, tree.proofFor(addresses[0]), tree.root)).toBe(
      false,
    );
    expect(verifyProof(addresses[0], ["0x1234"], tree.root)).toBe(false);
  });
});
