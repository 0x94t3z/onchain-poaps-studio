"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { isAddress, type Hex } from "viem";
import { poapAbi } from "@/lib/abi";
import { chain, CONTRACT, ZERO_ROOT, explorer, opensea } from "@/lib/constants";
import { decodeMetadata, deadline, remaining } from "@/lib/metadata";
import { verifyProof } from "@/lib/merkle";
import { isSignedPassFormat, verifySignedPass } from "@/lib/signed-pass";
import { useCurrentTimestamp } from "@/hooks/use-current-timestamp";
import { useMintCount } from "@/hooks/use-mint-count";
import { AddressIdentity } from "@/components/address-identity";
import { TxButton } from "@/components/tx-button";
import { EventShareActions } from "@/components/event-share-actions";
import { CalendarX, Clock, ExternalLink, LockKeyhole, MapPin, Users } from "lucide-react";
export default function EventPage({
  searchParams,
  params,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = use(params);
  const { from } = use(searchParams);
  const validId = /^[1-9]\d*$/.test(id);
  const eventId = BigInt(validId ? id : "0");
  const now = useCurrentTimestamp();
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
    query: { enabled: validId },
  });
  const u = useReadContract({
    address: CONTRACT,
    abi: poapAbi,
    functionName: "uri",
    args: [eventId],
    query: { enabled: validId },
  });
  const claimed = useReadContract({
    address: CONTRACT,
    abi: poapAbi,
    functionName: "hasClaimed",
    args: [eventId, address!],
    query: { enabled: Boolean(validId && address) },
  });
  const mintCount = useMintCount(eventId, validId);
  const [tab, setTab] = useState<"public" | "allowlist" | "signature">(
      "public",
    ),
    [proof, setProof] = useState(""),
    [sig, setSig] = useState(""),
    [signatureCheck, setSignatureCheck] = useState<{
      key: string;
      status: "idle" | "checking" | "valid" | "invalid";
    }>({ key: "", status: "idle" });
  useEffect(() => {
    const q = new URLSearchParams(window.location.search),
      pass = q.get("signature");
    if (pass) {
      setSig(pass);
      setTab("signature");
    }
  }, []);
  const eventCreator = e.data?.[6];
  useEffect(() => {
    if (!e.data) return;
    const allowlistAvailable = e.data[4] !== ZERO_ROOT;
    const publicAvailable = e.data[10];
    const signedAvailable = now <= deadline(e.data[7], 37);
    setTab((current) => {
      if (current === "public" && publicAvailable) return current;
      if (current === "allowlist" && allowlistAvailable) return current;
      if (current === "signature" && signedAvailable) return current;
      if (publicAvailable) return "public";
      if (allowlistAvailable) return "allowlist";
      return "signature";
    });
  }, [e.data, now]);
  const signatureValidationKey =
    address && eventCreator
      ? `${address.toLowerCase()}:${eventCreator.toLowerCase()}:${sig.trim()}`
      : "";
  useEffect(() => {
    const signature = sig.trim();
    if (!address || !eventCreator || !isSignedPassFormat(signature)) {
      setSignatureCheck({ key: signatureValidationKey, status: "idle" });
      return;
    }

    let active = true;
    setSignatureCheck({ key: signatureValidationKey, status: "checking" });
    verifySignedPass({
      eventId,
      chainId: chain.id,
      recipient: address,
      creator: eventCreator,
      signature,
    }).then((valid) => {
      if (active) {
        setSignatureCheck({
          key: signatureValidationKey,
          status: valid ? "valid" : "invalid",
        });
      }
    });

    return () => {
      active = false;
    };
  }, [address, eventCreator, eventId, sig, signatureValidationKey]);
  if (!validId)
    return (
      <section className="page"><div className="empty">POAP not found.</div></section>
    );
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
      available: now <= sigEnd,
      why: remaining(sigEnd, now),
    },
  ] as const;
  let proofs: Hex[] = [];
  try {
    proofs = proof.split(/[\s,]+/).filter(Boolean) as Hex[];
  } catch {}
  const proofIsValid = Boolean(address) && verifyProof(address!, proofs, root);
  const trimmedProof = proof.trim();
  const proofLooksLikeAddress =
    Boolean(trimmedProof) && isAddress(trimmedProof);
  const trimmedSignature = sig.trim();
  const signatureLooksLikeAddress =
    Boolean(trimmedSignature) && isAddress(trimmedSignature);
  const signatureFormatIsValid = isSignedPassFormat(trimmedSignature);
  const signatureCheckStatus =
    signatureCheck.key === signatureValidationKey
      ? signatureCheck.status
      : "checking";
  const backHref =
    from === "home"
      ? "/"
      : from === "gallery" || from === "created"
        ? "/gallery"
        : "/explore";
  const backLabel =
    from === "home"
      ? "← Back to home"
      : from === "gallery" || from === "created"
      ? "← Back to My POAPs"
      : "← Back to collection";
  return (
    <section className="page event">
      <Link href={backHref} className="back">
        {backLabel}
      </Link>
      <div className="event-layout">
        <div className="event-art">
          <img src={meta.image} alt={`${name} artwork`} />
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
                {new Date(Number(eventDate) * 1000).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </span>
            )}
            {location && (
              <span>
                <MapPin /> {location}
              </span>
            )}
            {eventDate === 0n && !location && (
              <span>
                <CalendarX /> No date or location provided
              </span>
            )}
            <span>
              <LockKeyhole /> {soulbound ? "Soulbound" : "Transferable"}
            </span>
            {typeof mintCount.data === "number" && (
              <span>
                <Users />{" "}
                {mintCount.data === 0
                  ? "No mints yet"
                  : `${mintCount.data.toLocaleString()} minted`}
              </span>
            )}
          </div>
          <div className="event-meta-actions">
            <span className="event-creator-line">
              <span>Created by</span>
              <AddressIdentity address={creator} context="Creator" />
            </span>
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
            <EventShareActions
              eventId={id}
              eventName={name}
              manageHref={
                address?.toLowerCase() === creator.toLowerCase()
                  ? `/manage/${id}`
                  : undefined
              }
            />
          </div>
        </div>
      </div>
      <div className="mint-panel panel">
        <div className="mint-intro">
          <span className="eyebrow">CHOOSE A MINT METHOD</span>
          <h2>Mint this POAP</h2>
          <p>
            Use the route shared by the organizer. Each wallet can collect this
            POAP once.
          </p>
        </div>
        <div className="mint-workflow">
          <div className="method-tabs" role="tablist" aria-label="Mint method">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`mint-tab-${m.id}`}
                aria-controls={`mint-panel-${m.id}`}
                aria-selected={tab === m.id}
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
            <div className="success big mint-status">
              This wallet already holds this POAP ✓
              <div>
                <a href={opensea(eventId)} target="_blank" rel="noreferrer">
                  View on OpenSea ↗
                </a>{" "}
                ·{" "}
                <a href={explorer(`token/${CONTRACT}?a=${id}`)} target="_blank" rel="noreferrer">
                  Verify on BaseScan ↗
                </a>
              </div>
            </div>
          ) : (
            <div
              className="mint-action"
              role="tabpanel"
              id={`mint-panel-${tab}`}
              aria-labelledby={`mint-tab-${tab}`}
            >
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
                    Paste the proof supplied by the organizer. The contract
                    checks it against the saved allowlist root.
                  </p>
                  <textarea
                    className="mono"
                    value={proof}
                    onChange={(x) => setProof(x.target.value)}
                    placeholder="0xabc… 0xdef…"
                  />
                  {trimmedProof && (
                    <p
                      className={proofIsValid ? "success" : "error"}
                      role="status"
                    >
                      {proofIsValid
                        ? "This proof matches the connected wallet."
                        : proofLooksLikeAddress
                          ? "That is a wallet address, not an allowlist proof. Ask the organizer for the proof generated for this wallet."
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
                    Paste the signature issued for this wallet. It cannot be
                    used by another address and expires{" "}
                    {new Date(sigEnd * 1000).toLocaleString()}.
                  </p>
                  <textarea
                    className="mono"
                    value={sig}
                    onChange={(x) => setSig(x.target.value)}
                    placeholder="0x… signed pass (132 characters)"
                  />
                  {trimmedSignature && (
                    <p
                      className={
                        signatureCheckStatus === "valid"
                          ? "success"
                          : signatureCheckStatus === "invalid" ||
                              !signatureFormatIsValid
                            ? "error"
                            : "note"
                      }
                      role="status"
                    >
                      {signatureLooksLikeAddress
                        ? "That is a wallet address, not a signed pass. The organizer must generate a pass for this address from the event Manage page."
                        : !signatureFormatIsValid
                          ? "A signed pass is a 65-byte signature beginning with 0x. Copy the complete signature generated by the organizer."
                          : !address
                            ? "Connect the intended recipient wallet to verify this pass."
                            : signatureCheckStatus === "checking" ||
                                signatureCheckStatus === "idle"
                              ? "Checking this pass for the connected wallet…"
                              : signatureCheckStatus === "valid"
                                ? "Verified: this pass was issued by the event creator for the connected wallet."
                                : "This pass was issued for a different wallet or was not signed by the event creator. Connect the intended recipient or request a new pass."}
                    </p>
                  )}
                  <TxButton
                    name="mintWithSignature"
                    args={[eventId, trimmedSignature as Hex]}
                    label="Use signed pass & mint"
                    disabled={
                      !address ||
                      signatureCheckStatus !== "valid" ||
                      isCheckingGas ||
                      needsTestEth
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
