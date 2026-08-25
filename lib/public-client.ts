import { createPublicClient, http } from "viem";
import { chain } from "@/lib/constants";

export const publicClient = createPublicClient({
  chain,
  transport: http(
    process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org",
  ),
});
