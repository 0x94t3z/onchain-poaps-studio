import { NextResponse } from "next/server";
import { getAddress, isAddress, padHex, toEventSelector } from "viem";
import { CONTRACT } from "@/lib/constants";
import { createdEventIdsFromLogs } from "@/lib/event-ownership";

const NEW_EVENT_TOPIC = toEventSelector("NewEvent(uint256,string,address)");
const BLOCKSCOUT_API = "https://base-sepolia.blockscout.com/api";

type BlockscoutLogsResponse = {
  status?: string;
  message?: string;
  result?: unknown;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  if (!isAddress(address))
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });

  const owner = getAddress(address);
  const query = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    fromBlock: "0",
    toBlock: "latest",
    address: CONTRACT,
    topic0: NEW_EVENT_TOPIC,
    topic2: padHex(owner, { size: 32 }),
    topic0_2_opr: "and",
  });

  try {
    const response = await fetch(`${BLOCKSCOUT_API}?${query}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Blockscout returned ${response.status}`);

    const payload = (await response.json()) as BlockscoutLogsResponse;
    if (!Array.isArray(payload.result))
      throw new Error(payload.message || "Creator logs were unavailable");

    const eventIds = createdEventIdsFromLogs(payload.result).map(String);
    return NextResponse.json({ eventIds });
  } catch (error) {
    console.error("Created POAP lookup failed", error);
    return NextResponse.json(
      { error: "Created POAPs could not be indexed right now." },
      { status: 502 },
    );
  }
}
