"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useSignMessage } from "wagmi";
import {
  encodePacked,
  getAddress,
  isAddress,
  keccak256,
  type Address,
  type Hex,
} from "viem";
import QRCode from "qrcode";
import { poapAbi } from "@/lib/abi";
import {
  chain,
  CONTRACT,
  CREATOR_WINDOW,
  SIGNATURE_WINDOW,
  ZERO_ROOT,
} from "@/lib/constants";
import { deadline, remaining } from "@/lib/metadata";
import { buildTree, normalizeAddresses } from "@/lib/merkle";
import { AddressIdentity } from "@/components/address-identity";
import { TxButton } from "@/components/tx-button";
export default function Manage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params),
    eventId = BigInt(id),
    { address, isReconnecting } = useAccount();
  const query = useReadContract({
    address: CONTRACT,
    abi: poapAbi,
    functionName: "events",
    args: [eventId],
  });
  const [list, setList] = useState(""),
    [recipient, setRecipient] = useState(""),
    [batch, setBatch] = useState(""),
    [signature, setSignature] = useState<Hex>(),
    [qr, setQr] = useState(""),
    [claimUrl, setClaimUrl] = useState(""),
    [copied, setCopied] = useState<"signature" | "link">();
  const signer = useSignMessage();
  const tree = useMemo(() => {
    try {
      return list.trim() ? buildTree(normalizeAddresses(list)) : null;
    } catch {
      return null;
    }
  }, [list]);
  if (!query.data || isReconnecting)
    return (
      <section className="page">
        <div className="empty">
          {isReconnecting
            ? "Restoring wallet connection…"
            : "Loading creator controls…"}
        </div>
      </section>
    );
  const [name, , , , root, , creator, createdAt, , , isPublic] = query.data;
  const isCreator = address?.toLowerCase() === creator.toLowerCase(),
    controlEnd = deadline(createdAt, 30),
    signatureEnd = deadline(createdAt, 37),
    controlOpen = Date.now() / 1000 <= controlEnd;
  let recipients: Address[] = [];
  try {
    recipients = normalizeAddresses(batch);
  } catch {}
  async function sign() {
    if (!isAddress(recipient)) return;
    const hash = keccak256(
      encodePacked(
        ["uint256", "uint256", "address"],
        [eventId, BigInt(chain.id), getAddress(recipient)],
      ),
    );
    signer.signMessage(
      { message: { raw: hash } },
      {
        onSuccess: async (sig) => {
          setSignature(sig);
          const base =
            process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
          const url = `${base}/event/${id}?method=signature&signature=${sig}`;
          setClaimUrl(url);
          setQr(
            await QRCode.toDataURL(url, {
              width: 420,
              margin: 2,
              color: { dark: "#171717", light: "#eeff41" },
            }),
          );
        },
      },
    );
  }
  async function copy(value: string, type: "signature" | "link") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(undefined), 1800);
  }
  if (!address)
    return (
      <section className="page">
        <div className="empty">
          <span className="eyebrow">EVENT SETTINGS · EVENT #{id}</span>
          <h2>Connect the creator wallet</h2>
          <p>
            Connect the wallet that created this POAP to change mint settings,
            manage its allowlist, or issue signed passes.
          </p>
        </div>
      </section>
    );
  if (!isCreator)
    return (
      <section className="page">
        <div className="empty">
          <h2>Creator access only</h2>
          <p>
            This POAP is controlled by{" "}
            <AddressIdentity address={creator} context="Creator" />.
          </p>
        </div>
      </section>
    );
  return (
    <section className="page manage">
      <span className="eyebrow">EVENT SETTINGS · EVENT #{id}</span>
      <h1>
        Manage
        <br />
        <em>{name}</em>
      </h1>
      <div className="deadline-bar">
        <span>Creator controls close in</span>
        <strong>{remaining(controlEnd)}</strong>
        <span>Signed passes expire in</span>
        <strong>{remaining(signatureEnd)}</strong>
      </div>
      <div className="manage-grid">
        <article className="panel">
          <span className="eyebrow">PUBLIC MINT</span>
          <h2>{isPublic ? "Public mint is open" : "Public mint is closed"}</h2>
          <p>
            You can toggle this status only during the 30-day creator window.
            Existing mints are never affected.
          </p>
          <TxButton
            name="updateEventPublic"
            args={[eventId, !isPublic]}
            label={isPublic ? "Close public mint" : "Open public mint"}
            disabled={!isCreator || !controlOpen}
          />
        </article>
        <article className="panel">
          <span className="eyebrow">CREATOR DROP</span>
          <h2>Mint to attendee wallets</h2>
          <p>
            Batch mint to up to 101 unique recipients. Wallets that already
            claimed are skipped by the contract.
          </p>
          <textarea
            className="mono"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="One address per line"
          />
          <small>{recipients.length}/101 valid unique addresses</small>
          <TxButton
            name="creatorMint"
            args={[eventId, recipients]}
            label="Mint to recipients"
            disabled={
              !isCreator ||
              !controlOpen ||
              !recipients.length ||
              recipients.length > 101
            }
          />
        </article>
        <article className="panel wide-card">
          <span className="eyebrow">ALLOWLIST BUILDER</span>
          <h2>Build an allowlist</h2>
          <p>
            Paste one wallet per line. Download the JSON before saving the root;
            each recipient needs their proof to mint. The root can only be set
            once.
          </p>
          <textarea
            className="mono tall"
            value={list}
            onChange={(e) => setList(e.target.value)}
            placeholder="0x123…\n0x456…"
          />
          {tree && (
            <>
              <div className="root">
                <span>Merkle root</span>
                <code>{tree.root}</code>
              </div>
              <button
                className="button secondary"
                onClick={() =>
                  download(
                    `${name}-allowlist.json`,
                    JSON.stringify(
                      {
                        eventId: id,
                        chainId: chain.id,
                        contract: CONTRACT,
                        root: tree.root,
                        recipients: tree.entries,
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                Download recipient proofs
              </button>
              <TxButton
                name="updateAllowlistRoot"
                args={[eventId, tree.root]}
                label="Set root permanently"
                disabled={!isCreator || !controlOpen || root !== ZERO_ROOT}
              />
            </>
          )}
          {root !== ZERO_ROOT && (
            <div className="success">
              Allowlist root is already locked onchain.
            </div>
          )}
        </article>
        <article className="panel wide-card">
          <span className="eyebrow">SIGNED PASS + QR</span>
          <h2>Issue a signed mint</h2>
          <ol>
            <li>Enter the attendee wallet.</li>
            <li>
              Sign the event ID, Base Sepolia chain ID, and recipient address.
              This does not send a transaction or cost gas.
            </li>
            <li>
              Share the signature or QR privately. Only that wallet can redeem
              it before the 37-day deadline.
            </li>
          </ol>
          <div className="pass-form">
            <label htmlFor="pass-recipient">Attendee wallet</label>
            <div className="pass-form-row">
              <input
                id="pass-recipient"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setSignature(undefined);
                  setQr("");
                  setClaimUrl("");
                }}
                placeholder="0x recipient address"
                spellCheck={false}
              />
              <button
                className="button"
                disabled={
                  !isCreator ||
                  !isAddress(recipient) ||
                  Date.now() / 1000 > signatureEnd ||
                  signer.isPending
                }
                onClick={sign}
              >
                {signer.isPending ? "Confirm in wallet…" : "Generate pass"}
              </button>
            </div>
            {recipient && !isAddress(recipient) && (
              <p className="error" role="status">
                Enter a complete EVM wallet address beginning with 0x.
              </p>
            )}
          </div>
          {signer.error && (
            <p className="error" role="alert">
              The pass was not generated. Approve the signature request in the
              creator wallet and try again.
            </p>
          )}
          {signature && (
            <div className="pass-result" aria-live="polite">
              <div className="pass-result-heading">
                <div>
                  <span className="eyebrow">PASS READY</span>
                  <h3>Send it to this attendee</h3>
                </div>
                <span className="pass-status">Signed</span>
              </div>
              <div className="pass-result-grid">
                {qr && (
                  <figure className="pass-qr">
                    <img src={qr} alt="Signed mint claim QR code" />
                    <figcaption>Scan to open the private mint link</figcaption>
                  </figure>
                )}
                <div className="pass-delivery">
                  <div className="pass-detail">
                    <span>Recipient</span>
                    <AddressIdentity
                      address={getAddress(recipient)}
                      context="Recipient"
                    />
                  </div>
                  <div className="pass-detail">
                    <span>Signed pass</span>
                    <code>{signature}</code>
                  </div>
                  <div className="pass-actions">
                    <button
                      className="button"
                      onClick={() => copy(signature, "signature")}
                    >
                      {copied === "signature"
                        ? "Signature copied ✓"
                        : "Copy signature"}
                    </button>
                    {claimUrl && (
                      <>
                        <button
                          className="button secondary"
                          onClick={() => copy(claimUrl, "link")}
                        >
                          {copied === "link"
                            ? "Link copied ✓"
                            : "Copy mint link"}
                        </button>
                        <a
                          className="text-link"
                          href={claimUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Preview mint page ↗
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="note pass-note">
                This pass only works for the recipient above. Send it privately
                and generate a separate pass for each attendee.
              </p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
function download(name: string, data: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
