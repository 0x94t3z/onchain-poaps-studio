import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { signedPassMessageHash, verifySignedPass } from "./signed-pass";

const creator = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000001",
);
const anotherCreator = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000002",
);
const recipient = "0x0000000000000000000000000000000000000003";
const anotherRecipient = "0x0000000000000000000000000000000000000004";

describe("signed passes", () => {
  it("accepts the creator signature for its intended recipient", async () => {
    const signature = await creator.signMessage({
      message: { raw: signedPassMessageHash(7n, 84532, recipient) },
    });

    await expect(
      verifySignedPass({
        eventId: 7n,
        chainId: 84532,
        recipient,
        creator: creator.address,
        signature,
      }),
    ).resolves.toBe(true);
  });

  it("rejects a pass presented by a different recipient", async () => {
    const signature = await creator.signMessage({
      message: { raw: signedPassMessageHash(7n, 84532, recipient) },
    });

    await expect(
      verifySignedPass({
        eventId: 7n,
        chainId: 84532,
        recipient: anotherRecipient,
        creator: creator.address,
        signature,
      }),
    ).resolves.toBe(false);
  });

  it("rejects a pass not signed by the event creator", async () => {
    const signature = await anotherCreator.signMessage({
      message: { raw: signedPassMessageHash(7n, 84532, recipient) },
    });

    await expect(
      verifySignedPass({
        eventId: 7n,
        chainId: 84532,
        recipient,
        creator: creator.address,
        signature,
      }),
    ).resolves.toBe(false);
  });
});
