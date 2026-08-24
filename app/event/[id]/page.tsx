"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useBalance, useReadContract } from "wagmi";
import type { Hex } from "viem";
import { poapAbi } from "@/lib/abi";
import {
  chain,
  CONTRACT,
  ZERO_ROOT,
  explorer,
  opensea,
} from "@/lib/constants";
import { decodeMetadata, deadline, remaining } from "@/lib/metadata";
import { verifyProof } from "@/lib/merkle";
import { AddressIdentity } from "@/components/address-identity";
import { TxButton } from "@/components/tx-button";
import { Clock, ExternalLink, LockKeyhole, MapPin } from "lucide-react";
export default function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = BigInt(id);
  const { address } = useAccount();
  const balance = useBalance({
    address,
    chainId: chain.id,
    query: { enabled: Boolean(address) },
  });
  const e = useReadContract({
    address: CONTRACT,
    abi: poapAbi,
    functionName: "events",
    args: [eventId],
  });
  const u = useReadContract({
    address: CONTRACT,
    abi: poapAbi,
    functionName: "uri",
    args: [eventId],
  });
  const claimed = useReadContract({
    address: CONTRACT,
    abi: poapAbi,
    functionName: "hasClaimed",
    args: [eventId, address!],
    query: { enabled: !!address },
  });
  const [tab, setTab] = useState<"public" | "allowlist" | "signature">(
      "public",
    ),
    [proof, setProof] = useState(""),
    [sig, setSig] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search),
      pass = q.get("signature");
    if (pass) {
      setSig(pass);
      setTab("signature");
    }
  }, []);
  if (e.isLoading || u.isLoading)
    return (
      <section className="page">
        <div className="empty">Loading POAP from Base…</div>
      </section>
    );
  if (!e.data || !u.data)
    return (
      <section className="page">
        <div className="empty">POAP not found.</div>
      </section>
    );
  const [
    name,
    description,
    eventDate,
    location,
    root,
    ,
    creator,
    createdAt,
    url,
    soulbound,
    isPublic,
  ] = e.data;
  const meta = decodeMetadata(u.data);
  const sigEnd = deadline(createdAt, 37);
  const isCheckingGas = Boolean(address) && balance.isLoading;
  const needsTestEth = Boolean(address) && balance.data?.value === 0n;
  const methods = [
    {
      id: "public",
      label: "Public",
      available: isPublic,
      why: isPublic ? "Open to everyone" : "Closed by creator",
    },
    {
      id: "allowlist",
      label: "Allowlist",
      available: root !== ZERO_ROOT,
      why: root !== ZERO_ROOT ? "Proof required" : "Not configured",
    },
    {
      id: "signature",
      label: "Signed pass",
      available: Date.now() / 1000 <= sigEnd,
      why: remaining(sigEnd),
    },
  ] as const;
  let proofs: Hex[] = [];
  try {
    proofs = proof.split(/[\s,]+/).filter(Boolean) as Hex[];
  } catch {}
  const proofIsValid = Boolean(address) && verifyProof(address!, proofs, root);
  return (
    <section className="page event">
      <Link href="/explore" className="back">
        ← Back to collection
      </Link>
      <div className="event-layout">
        <div className="event-art">
          <img src={meta.image} />
          <span>#{id.padStart(3, "0")}</span>
        </div>
        <div className="event-info">
          <div className="eyebrow">
            {isPublic ? "OPEN MINT" : "GATED"} · BASE SEPOLIA
          </div>
          <h1>{name}</h1>
          <p className="lead">{description || "No description provided."}</p>
          <div className="facts">
            {eventDate > 0n && (
              <span>
                <Clock />{" "}
                {new Date(Number(eventDate) * 1000).toLocaleDateString()}
              </span>
            )}
            {location && (
              <span>
                <MapPin /> {location}
              </span>
            )}
            <span>
              <LockKeyhole /> {soulbound ? "Soulbound" : "Transferable"}
            </span>
          </div>
          <div className="event-meta-actions">
            <div className="event-owner">
                <span className="event-creator-line">
                  <span>Created by</span>
                  <AddressIdentity address={creator} context="Creator" />
                </span>
              {address?.toLowerCase() === creator.toLowerCase() && (
                <Link className="button tiny" href={`/manage/${id}`}>
                  Manage
                </Link>
              )}
            </div>
            {url && (
              <a
                className="text-link event-website"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                Event website <ExternalLink size={16} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mint-panel panel">
        <div>
          <span className="eyebrow">CHOOSE A MINT METHOD</span>
          <h2>Mint this POAP</h2>
        </div>
        <div className="method-tabs">
          {methods.map((m) => (
            <button
              key={m.id}
              disabled={!m.available}
              className={tab === m.id ? "active" : ""}
              onClick={() => setTab(m.id)}
            >
              {m.label}
              <small>{m.why}</small>
            </button>
          ))}
        </div>
        {needsTestEth && (
          <div className="funding-note" role="status">
            <strong>Base Sepolia test ETH required</strong>
            <p>
              This wallet has no test ETH to pay network gas. Test ETH has no
              real-world value.
            </p>
            <a
              href="https://docs.base.org/base-chain/network-information/network-faucets"
              target="_blank"
              rel="noreferrer"
            >
              Find a Base Sepolia faucet ↗
            </a>
          </div>
        )}
        {claimed.data ? (
          <div className="success big">
            This wallet already holds this POAP ✓
            <div>
              <a href={opensea(eventId)} target="_blank">
                View on OpenSea ↗
              </a>{" "}
              ·{" "}
              <a href={explorer(`token/${CONTRACT}?a=${id}`)} target="_blank">
                Verify on BaseScan ↗
              </a>
            </div>
          </div>
        ) : (
          <>
            {tab === "public" && (
              <div>
                <p>
                  Anyone can mint while the creator keeps public minting open.
                  The contract allows one token per wallet.
                </p>
                <TxButton
                  name="mint"
                  args={[eventId]}
                  label="Mint public POAP"
                  disabled={
                    !address || !isPublic || isCheckingGas || needsTestEth
                  }
                />
              </div>
            )}
            {tab === "allowlist" && (
              <div>
                <p>
                  Paste the proof supplied by the organizer. The contract checks
                  it against the saved allowlist root.
                </p>
                <textarea
                  className="mono"
                  value={proof}
                  onChange={(x) => setProof(x.target.value)}
                  placeholder="0xabc… 0xdef…"
                />
                {proof.trim() && (
                  <p
                    className={proofIsValid ? "success" : "error"}
                    role="status"
                  >
                    {proofIsValid
                      ? "This proof matches the connected wallet."
                      : "This proof belongs to a different wallet or is invalid. Ask the organizer for the proof generated for this wallet."}
                  </p>
                )}
                <TxButton
                  name="allowlistMint"
                  args={[eventId, proofs]}
                  label="Verify proof & mint"
                  disabled={
                    !address ||
                    root === ZERO_ROOT ||
                    !proofIsValid ||
                    isCheckingGas ||
                    needsTestEth
                  }
                />
              </div>
            )}
            {tab === "signature" && (
              <div>
                <p>
                  Paste the signature issued for this wallet. It cannot be used
                  by another address and expires{" "}
                  {new Date(sigEnd * 1000).toLocaleString()}.
                </p>
                <textarea
                  className="mono"
                  value={sig}
                  onChange={(x) => setSig(x.target.value)}
                  placeholder="0x signature"
                />
                <TxButton
                  name="mintWithSignature"
                  args={[eventId, sig as Hex]}
                  label="Use signed pass & mint"
                  disabled={
                    !address ||
                    !/^0x[0-9a-fA-F]{130}$/.test(sig) ||
                    isCheckingGas ||
                    needsTestEth
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
