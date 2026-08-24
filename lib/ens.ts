import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  type Address,
} from "viem";
import { normalize } from "viem/ens";
import { mainnet } from "viem/chains";

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function getPrimaryEnsName(address: Address) {
  return ensClient.getEnsName({ address });
}

export async function resolveAddressOrEns(value: string): Promise<Address> {
  const input = value.trim();

  if (isAddress(input)) return getAddress(input);

  let name: string;
  try {
    name = normalize(input);
  } catch {
    throw new Error("Not a valid address or ENS name.");
  }

  if (!name.includes(".")) {
    throw new Error("Not a valid address or ENS name.");
  }

  const resolved = await ensClient.getEnsAddress({ name });
  if (!resolved) throw new Error("This ENS name does not resolve to an EVM address.");

  return getAddress(resolved);
}
