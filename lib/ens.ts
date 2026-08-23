import { createPublicClient, http, type Address } from "viem";
import { mainnet } from "viem/chains";

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function getPrimaryEnsName(address: Address) {
  return ensClient.getEnsName({ address });
}
