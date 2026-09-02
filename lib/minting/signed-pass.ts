import {
  encodePacked,
  getAddress,
  keccak256,
  recoverMessageAddress,
  type Address,
  type Hex,
} from "viem";

export function signedPassMessageHash(
  eventId: bigint,
  chainId: number,
  recipient: Address,
) {
  return keccak256(
    encodePacked(
      ["uint256", "uint256", "address"],
      [eventId, BigInt(chainId), getAddress(recipient)],
    ),
  );
}

export function isSignedPassFormat(value: string): value is Hex {
  return /^0x[0-9a-fA-F]{130}$/.test(value);
}

export async function verifySignedPass({
  eventId,
  chainId,
  recipient,
  creator,
  signature,
}: {
  eventId: bigint;
  chainId: number;
  recipient: Address;
  creator: Address;
  signature: string;
}) {
  if (!isSignedPassFormat(signature)) return false;

  try {
    const recovered = await recoverMessageAddress({
      message: {
        raw: signedPassMessageHash(eventId, chainId, recipient),
      },
      signature,
    });

    return recovered.toLowerCase() === creator.toLowerCase();
  } catch {
    return false;
  }
}
