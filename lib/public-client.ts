import { createPublicClient, fallback, http } from "viem";
import { chain } from "@/lib/constants";

const publicRpcUrl = "https://sepolia.base.org";
const configuredRpcUrl = process.env.NEXT_PUBLIC_RPC_URL?.trim();

export const publicClient = createPublicClient({
  chain,
  transport:
    configuredRpcUrl && configuredRpcUrl !== publicRpcUrl
      ? fallback([http(configuredRpcUrl), http(publicRpcUrl)])
      : http(publicRpcUrl),
});
