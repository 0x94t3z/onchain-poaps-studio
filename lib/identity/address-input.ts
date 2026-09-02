import { getAddress, type Address } from "viem";
import { resolveAddressOrEns } from "./ens";

export function parseAddressEntries(input: string) {
  return input
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function resolveAddressEntries(
  input: string,
  resolveEntry: (value: string) => Promise<Address> = resolveAddressOrEns,
) {
  const entries = [
    ...new Map(
      parseAddressEntries(input).map((entry) => [entry.toLowerCase(), entry]),
    ).values(),
  ];
  const resolved = new Array<Address>(entries.length);
  let cursor = 0;

  async function worker() {
    while (cursor < entries.length) {
      const index = cursor++;
      try {
        resolved[index] = getAddress(await resolveEntry(entries[index]));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not resolve it.";
        throw new Error(`${entries[index]}: ${message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(4, entries.length) }, () => worker()),
  );

  const addresses = new Map<string, Address>();
  for (const address of resolved) {
    addresses.set(address.toLowerCase(), address);
  }

  return {
    addresses: [...addresses.values()],
    entryCount: entries.length,
    ensCount: entries.filter((entry) => !entry.startsWith("0x")).length,
  };
}
