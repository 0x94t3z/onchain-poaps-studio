import { NextResponse } from "next/server";
import { padHex, parseAbiItem, toEventSelector, toHex } from "viem";
import { poapAbi } from "@/lib/blockchain/abi";
import { CONTRACT } from "@/lib/blockchain/constants";
import { publicClient } from "@/lib/blockchain/public-client";

export const maxDuration = 30;

const newMintEvent = parseAbiItem(
  "event NewMint(uint256 indexed eventId, address indexed recipient)",
);
const NEW_MINT_TOPIC = toEventSelector("NewMint(uint256,address)");
const BLOCKSCOUT_API = "https://base-sepolia.blockscout.com/api";
const cache = new Map<string, { minted: number | null; updatedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const LOG_CHUNK_SIZE = 9_500n;
const MAX_CHUNKS = 160;
const LOG_BATCH_SIZE = 8;
const CONTRACT_DEPLOY_BLOCK = BigInt(
  process.env.CONTRACT_DEPLOY_BLOCK ||
    process.env.NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK ||
    "45288813",
);

type BlockscoutLogsResponse = {
  status?: string;
  message?: string;
  result?: unknown;
};

async function countMintsFromBlockscout(eventId: bigint) {
  const query = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    fromBlock: "0",
    toBlock: "latest",
    address: CONTRACT,
    topic0: NEW_MINT_TOPIC,
    topic1: padHex(toHex(eventId), { size: 32 }),
    topic0_1_opr: "and",
  });

  const response = await fetch(`${BLOCKSCOUT_API}?${query}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Blockscout returned ${response.status}`);

  const payload = (await response.json()) as BlockscoutLogsResponse;
  if (!Array.isArray(payload.result))
    throw new Error(payload.message || "Mint logs were unavailable");

  return payload.result.length;
}

async function firstBlockAtOrAfterTimestamp(
  targetTimestamp: bigint,
  latestBlock: bigint,
) {
  let low = CONTRACT_DEPLOY_BLOCK;
  let high = latestBlock;

  while (low < high) {
    const mid = (low + high) / 2n;
    const block = await publicClient.getBlock({ blockNumber: mid });
    const timestamp = block.timestamp;

    if (timestamp < targetTimestamp) low = mid + 1n;
    else high = mid;
  }

  return low;
}

async function countMints(eventId: bigint) {
  try {
    return await countMintsFromBlockscout(eventId);
  } catch {
    // Blockscout is a fast optional indexer. Fall back to direct RPC logs when
    // it is rate-limited or unavailable.
  }

  const [event, latestBlock] = await Promise.all([
    publicClient.readContract({
      address: CONTRACT,
      abi: poapAbi,
      functionName: "events",
      args: [eventId],
    }),
    publicClient.getBlockNumber(),
  ]);

  const createdAt = event[7];
  const startBlock =
    createdAt > 0n
      ? await firstBlockAtOrAfterTimestamp(createdAt, latestBlock)
      : 0n;
  const chunks =
    Number((latestBlock - startBlock + LOG_CHUNK_SIZE) / LOG_CHUNK_SIZE);

  if (chunks > MAX_CHUNKS)
    throw new Error("Mint count range is too large for a request-time scan.");

  const ranges: Array<{ fromBlock: bigint; toBlock: bigint }> = [];
  for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += LOG_CHUNK_SIZE) {
    const toBlock =
      fromBlock + LOG_CHUNK_SIZE - 1n > latestBlock
        ? latestBlock
        : fromBlock + LOG_CHUNK_SIZE - 1n;
    ranges.push({ fromBlock, toBlock });
  }

  let minted = 0;
  for (let index = 0; index < ranges.length; index += LOG_BATCH_SIZE) {
    const batch = ranges.slice(index, index + LOG_BATCH_SIZE);
    const counts = await Promise.all(
      batch.map(async ({ fromBlock, toBlock }) => {
        const logs = await publicClient.getLogs({
          address: CONTRACT,
          event: newMintEvent,
          args: { eventId },
          fromBlock,
          toBlock,
        });
        return logs.length;
      }),
    );
    minted += counts.reduce((total, count) => total + count, 0);
  }

  return minted;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id))
    return NextResponse.json({ minted: null, updatedAt: Date.now() });

  const cached = cache.get(id);
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL)
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });

  try {
    const minted = await countMints(BigInt(id));
    const result = { minted, updatedAt: Date.now() };
    cache.set(id, result);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch {
    const result = { minted: null, updatedAt: Date.now() };
    cache.set(id, result);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
    });
  }
}
