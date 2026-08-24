"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArtworkStudio } from "@/components/artwork-studio";
import { TxButton } from "@/components/tx-button";
import { ZERO_ROOT } from "@/lib/constants";
import { buildTree, normalizeAddresses } from "@/lib/merkle";
import { downloadJson } from "@/lib/download";
import { validateSvgSource } from "@/lib/svg";
import { Check } from "lucide-react";
import { parseEventLogs } from "viem";
import { poapAbi } from "@/lib/abi";
import { DateTimePicker } from "@/components/date-time-picker";
const blank =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="256" fill="#171717"/><circle cx="256" cy="256" r="210" fill="none" stroke="#eeff41" stroke-width="12"/><text x="256" y="240" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="white">I WAS</text><text x="256" y="302" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="700" fill="#eeff41">THERE</text></svg>';
export default function Create() {
  const [step, setStep] = useState(1),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [date, setDate] = useState(""),
    [location, setLocation] = useState(""),
    [url, setUrl] = useState(""),
    [svg, setSvg] = useState(blank),
    [soulbound, setSoulbound] = useState(true),
    [isPublic, setPublic] = useState(true),
    [list, setList] = useState(""),
    [downloadedAllowlistRoot, setDownloadedAllowlistRoot] = useState(""),
    [createdEventId, setCreatedEventId] = useState<string | null>(null),
    [eventLinkCopied, setEventLinkCopied] = useState(false);
  const allowlist = useMemo(() => {
    try {
      if (!list.trim()) return { tree: null, error: "" };
      return { tree: buildTree(normalizeAddresses(list)), error: "" };
    } catch (reason) {
      return {
        tree: null,
        error:
          reason instanceof Error
            ? reason.message
            : "Check every allowlist address.",
      };
    }
  }, [list]);
  const allow = allowlist.tree?.root ?? ZERO_ROOT;
  const bytes = (x: string) => new TextEncoder().encode(x).length;
  const svgValidation = useMemo(() => validateSvgSource(svg), [svg]);
  const urlIsValid = useMemo(() => {
    if (!url.trim()) return true;
    try {
      return ["http:", "https:"].includes(new URL(url).protocol);
    } catch {
      return false;
    }
  }, [url]);
  const detailsAreValid =
    name.trim().length > 0 &&
    bytes(name) <= 128 &&
    bytes(description) <= 512 &&
    bytes(location) <= 128 &&
    bytes(url) <= 128 &&
    urlIsValid;
  const allowlistIsSafe =
    !list.trim() ||
    Boolean(
      allowlist.tree && downloadedAllowlistRoot === allowlist.tree.root,
    );
  const valid =
    detailsAreValid && svgValidation.valid && allowlistIsSafe;
  const flags = (soulbound ? 1 : 0) + (isPublic ? 2 : 0);
  const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return (
    <section className="page create">
      <span className="eyebrow">CREATE · STEP {step} OF 4</span>
      <h1>
        Create an
        <br />
        <em>onchain POAP.</em>
      </h1>
      <div className="stepper">
        {["Artwork", "Details", "Distribution", "Review"].map((x, i) => (
          <button
            type="button"
            onClick={() => i + 1 <= step && setStep(i + 1)}
            className={step === i + 1 ? "current" : step > i + 1 ? "done" : ""}
            aria-current={step === i + 1 ? "step" : undefined}
            aria-label={`${x}, step ${i + 1} of 4${step > i + 1 ? ", completed" : ""}`}
            key={x}
          >
            <span>{step > i + 1 ? <Check size={15} /> : i + 1}</span>
            {x}
          </button>
        ))}
      </div>
      <div hidden={step !== 1}>
        <ArtworkStudio onChange={setSvg} />
      </div>
      {step === 2 && (
        <div className="form-layout">
          <div className="panel form">
            <label>
              POAP name <b>{bytes(name)}/128 bytes</b>
              <input
                value={name}
                maxLength={128}
                onChange={(e) => setName(e.target.value)}
                placeholder="Base Builders Summit"
                aria-describedby="name-limit"
              />
              {bytes(name) > 128 && (
                <small id="name-limit" className="field-error">
                  Shorten the name to 128 UTF-8 bytes.
                </small>
              )}
            </label>
            <label>
              Description <b>{bytes(description)}/512 bytes</b>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this event about?"
              />
              {bytes(description) > 512 && (
                <small className="field-error">
                  Shorten the description to 512 UTF-8 bytes.
                </small>
              )}
            </label>
            <div className="split">
              <div className="field-group">
                <label>Event date</label>
                <DateTimePicker value={date} onChange={setDate} />
                <small>
                  Interpreted in {Intl.DateTimeFormat().resolvedOptions().timeZone}.
                </small>
              </div>
              <label>
                Location <b>{bytes(location)}/128</b>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Jakarta · Online"
                />
                {bytes(location) > 128 && (
                  <small className="field-error">
                    Shorten the location to 128 UTF-8 bytes.
                  </small>
                )}
              </label>
            </div>
            <label>
              Project URL <b>{bytes(url)}/128</b>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
              {!urlIsValid && (
                <small className="field-error">
                  Enter a complete http:// or https:// URL.
                </small>
              )}
              {bytes(url) > 128 && (
                <small className="field-error">
                  Shorten the URL to 128 UTF-8 bytes.
                </small>
              )}
            </label>
          </div>
          <aside className="preview panel">
            <span className="eyebrow">LIVE PREVIEW</span>
            <img src={image} alt="POAP preview" />
            <h3>{name || "Your POAP name"}</h3>
            <p>{description || "Your event description will appear here."}</p>
            <small>
              {new Blob([svg]).size.toLocaleString()} bytes · stored onchain
            </small>
          </aside>
        </div>
      )}
      {step === 3 && (
        <div className="panel form narrow">
          <h2>How can people collect it?</h2>
          <Toggle
            title="Soulbound"
            text="Permanent proof tied to the recipient wallet. It cannot be transferred."
            on={soulbound}
            set={setSoulbound}
          />
          <Toggle
            title="Public mint"
            text="Anyone may claim one. You can open or close this during the first 30 days."
            on={isPublic}
            set={setPublic}
          />
          <label>
            Optional allowlist addresses
            <textarea
              className="mono"
              value={list}
              onChange={(e) => {
                setList(e.target.value);
                setDownloadedAllowlistRoot("");
              }}
              placeholder="One wallet address per line"
            />
          </label>
          {allowlist.error && (
            <p className="error" role="alert">
              {allowlist.error}
            </p>
          )}
          {allowlist.tree && (
            <div className="root">
              <span>Generated Merkle root</span>
              <code>{allow}</code>
              <small>
                This list uses sorted address leaves compatible with the
                contract’s keccak256(abi.encodePacked(address)) check.
              </small>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  downloadJson(
                    `${name.trim() || "onchain-poap"}-allowlist-proofs.json`,
                    {
                      eventName: name.trim() || null,
                      root: allowlist.tree!.root,
                      recipients: allowlist.tree!.entries,
                      note: "Keep this file private and give each recipient only their own proof.",
                    },
                  );
                  setDownloadedAllowlistRoot(allowlist.tree!.root);
                }}
              >
                {downloadedAllowlistRoot === allowlist.tree.root
                  ? "Proof file downloaded ✓"
                  : "Download recipient proofs"}
              </button>
            </div>
          )}
          {allowlist.tree && downloadedAllowlistRoot !== allowlist.tree.root && (
            <p className="warning" role="status">
              Download the recipient proofs before review. The Merkle root is
              permanent and attendees cannot mint without their proof.
            </p>
          )}
          <p className="note">
            Signed mints do not need setup now. The creator can sign
            recipient-specific passes for 37 days after registration.
          </p>
        </div>
      )}
      {step === 4 && (
        <div className="form-layout">
          <div className="panel review">
            <span className="eyebrow">FINAL CHECK</span>
            <h2>{name || "Untitled POAP"}</h2>
            <dl>
              <div>
                <dt>Transfer</dt>
                <dd>{soulbound ? "Soulbound" : "Transferable"}</dd>
              </div>
              <div>
                <dt>Public mint</dt>
                <dd>{isPublic ? "Open" : "Closed"}</dd>
              </div>
              <div>
                <dt>Allowlist</dt>
                <dd>{allow === ZERO_ROOT ? "Not configured" : "Configured"}</dd>
              </div>
              <div>
                <dt>Creator control</dt>
                <dd>30 days</dd>
              </div>
            </dl>
            {date && (
              <p className="review-time">
                Event time: {new Date(date).toLocaleString()} (
                {Intl.DateTimeFormat().resolvedOptions().timeZone})
              </p>
            )}
            <TxButton
              name="registerEvent"
              args={[
                name,
                description,
                date ? BigInt(Math.floor(new Date(date).getTime() / 1000)) : 0n,
                location,
                allow,
                svg,
                url,
                flags,
              ]}
              label="Register POAP on Base"
              disabled={!valid}
              onSuccess={(receipt) => {
                const eventLog = parseEventLogs({
                  abi: poapAbi,
                  eventName: "NewEvent",
                  logs: receipt.logs,
                })[0];
                if (eventLog) {
                  setCreatedEventId(eventLog.args.eventId.toString());
                }
              }}
            />
            {createdEventId && (
              <div className="creation-next" role="status">
                <span className="eyebrow">POAP REGISTERED</span>
                <h3>Ready to share.</h3>
                <p>
                  Open the event page to share its mint, or manage how attendees
                  can collect it.
                </p>
                <div className="creation-next-actions">
                  <Link className="button" href={`/event/${createdEventId}`}>
                    View and share POAP →
                  </Link>
                  <Link
                    className="button secondary"
                    href={`/manage/${createdEventId}`}
                  >
                    Manage distribution
                  </Link>
                  <button
                    type="button"
                    className="text-link"
                    onClick={async () => {
                      const eventUrl = `${window.location.origin}/event/${createdEventId}`;
                      await navigator.clipboard.writeText(eventUrl);
                      setEventLinkCopied(true);
                      window.setTimeout(() => setEventLinkCopied(false), 1800);
                    }}
                  >
                    {eventLinkCopied ? "Link copied ✓" : "Copy event link"}
                  </button>
                  <a className="text-link" href="/create">
                    Create another
                  </a>
                </div>
              </div>
            )}
            {!valid && (
              <p className="error">
                Add valid required fields and stay within every byte limit.
              </p>
            )}
          </div>
          <aside className="preview panel">
            <img src={image} alt={`${name || "POAP"} artwork`} />
            <p>
              Review artwork and metadata carefully. Registration is immutable
              and stores the raw SVG onchain.
            </p>
          </aside>
        </div>
      )}
      <div className="form-nav">
        {step > 1 && (
          <button
            type="button"
            className="button secondary"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
        {step < 4 && (
          <button
            type="button"
            className="button"
            disabled={
              (step === 1 && !svgValidation.valid) ||
              (step === 2 && !detailsAreValid) ||
              (step === 3 && (!allowlistIsSafe || Boolean(allowlist.error)))
            }
            onClick={() => setStep(step + 1)}
          >
            Continue →
          </button>
        )}
      </div>
    </section>
  );
}
function Toggle({
  title,
  text,
  on,
  set,
}: {
  title: string;
  text: string;
  on: boolean;
  set: (x: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="toggle-row"
      role="switch"
      aria-checked={on}
      onClick={() => set(!on)}
    >
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <i className={on ? "on" : ""}>
        <b />
      </i>
    </button>
  );
}
