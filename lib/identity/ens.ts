import {
  createPublicClient,
  fallback,
  getAddress,
  http,
  isAddress,
  type Address,
} from "viem";
import { normalize } from "viem/ens";
import { mainnet } from "viem/chains";

const ENS_LOOKUP_TIMEOUT = 5_000;
const ENS_RPC_URLS = [
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
  "https://eth.drpc.org",
  "https://ethereum-rpc.publicnode.com",
  "https://eth-mainnet.public.blastapi.io",
].filter(Boolean) as string[];

const ensClient = createPublicClient({
  chain: mainnet,
  transport: fallback(
    ENS_RPC_URLS.map((url) =>
      http(url, {
        retryCount: 0,
        timeout: ENS_LOOKUP_TIMEOUT,
      }),
    ),
    {
      retryCount: 0,
    },
  ),
});

export async function getPrimaryEnsName(address: Address) {
  try {
    return await ensClient.getEnsName({ address });
  } catch (error) {
    console.warn("ENS reverse lookup failed", error);
    return null;
  }
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
