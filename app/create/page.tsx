"use client";
import { useMemo, useState } from "react";
import { ArtworkStudio } from "@/components/artwork-studio";
import { TxButton } from "@/components/tx-button";
import { ZERO_ROOT } from "@/lib/constants";
import { buildTree, normalizeAddresses } from "@/lib/merkle";
import { Check } from "lucide-react";
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
    [list, setList] = useState("");
  const allow = useMemo(() => {
    try {
      return list.trim() ? buildTree(normalizeAddresses(list)).root : ZERO_ROOT;
    } catch {
      return ZERO_ROOT;
    }
  }, [list]);
  const bytes = (x: string) => new TextEncoder().encode(x).length;
  const valid =
    name.length > 0 &&
    bytes(name) <= 128 &&
    bytes(description) <= 512 &&
    bytes(location) <= 128 &&
    bytes(url) <= 128 &&
    svg.trim().startsWith("<svg");
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
            onClick={() => i + 1 <= step && setStep(i + 1)}
            className={step === i + 1 ? "current" : step > i + 1 ? "done" : ""}
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
              />
            </label>
            <label>
              Description <b>{bytes(description)}/512 bytes</b>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this event about?"
              />
            </label>
            <div className="split">
              <label>
                Event date
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Location <b>{bytes(location)}/128</b>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Jakarta · Online"
                />
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
              onChange={(e) => setList(e.target.value)}
              placeholder="One wallet address per line"
            />
          </label>
          {list && (
            <div className="root">
              <span>Generated Merkle root</span>
              <code>{allow}</code>
              <small>
                This list uses sorted address leaves compatible with the
                contract’s keccak256(abi.encodePacked(address)) check.
              </small>
            </div>
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
            />
            {!valid && (
              <p className="error">
                Add valid required fields and stay within every byte limit.
              </p>
            )}
          </div>
          <aside className="preview panel">
            <img src={image} />
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
            className="button secondary"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
        {step < 4 && (
          <button
            className="button"
            disabled={
              (step === 1 && !svg.trim().startsWith("<svg")) ||
              (step === 2 && !valid)
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
    <button className="toggle-row" onClick={() => set(!on)}>
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
