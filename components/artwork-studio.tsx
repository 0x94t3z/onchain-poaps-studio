"use client";

import { useEffect, useMemo, useState } from "react";
import { Code2, Upload } from "lucide-react";

const palettes = [
  { name: "Signal", background: "#171717", accent: "#eeff41", ink: "#ffffff" },
  { name: "Base", background: "#0a2fff", accent: "#ffffff", ink: "#ffffff" },
  { name: "Violet", background: "#261447", accent: "#b9ff66", ink: "#ffffff" },
  { name: "Clay", background: "#f2e8d5", accent: "#d74926", ink: "#171717" },
  { name: "Aqua", background: "#073b4c", accent: "#4de2c5", ink: "#ffffff" },
];

const marks = {
  spark:
    '<path d="M256 112 281 213 382 238 281 263 256 364 231 263 130 238 231 213Z" fill="ACCENT"/><circle cx="352" cy="144" r="18" fill="INK"/><circle cx="150" cy="346" r="12" fill="INK"/>',
  check:
    '<path d="m145 255 70 70 154-164" fill="none" stroke="ACCENT" stroke-width="40" stroke-linecap="square" stroke-linejoin="miter"/>',
  pin: '<path d="M256 104c-70 0-126 56-126 126 0 94 126 190 126 190s126-96 126-190c0-70-56-126-126-126Zm0 178a52 52 0 1 1 0-104 52 52 0 0 1 0 104Z" fill="ACCENT"/>',
  bolt: '<path d="M284 76 142 280h92l-10 156 146-220h-96Z" fill="ACCENT"/>',
};

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

function makeSvg({
  style,
  palette,
  mark,
  title,
  detail,
}: {
  style: string;
  palette: (typeof palettes)[number];
  mark: keyof typeof marks;
  title: string;
  detail: string;
}) {
  const frame =
    style === "split"
      ? `<path d="M0 0h512v138H0z" fill="${palette.accent}"/><path d="M24 162h464v326H24z" fill="none" stroke="${palette.accent}" stroke-width="4"/>`
      : style === "orbit"
        ? `<circle cx="256" cy="256" r="222" fill="none" stroke="${palette.accent}" stroke-width="4"/><circle cx="256" cy="256" r="194" fill="none" stroke="${palette.ink}" stroke-width="2" stroke-dasharray="8 12"/>`
        : `<path d="M28 28h456v456H28z" fill="none" stroke="${palette.accent}" stroke-width="8"/><path d="M28 116h456M28 396h456" stroke="${palette.accent}" stroke-width="3"/>`;
  const layout =
    style === "split"
      ? {
          markTransform: "translate(102 145) scale(.6)",
          titleY: 88,
          detailY: 456,
          titleColor: palette.background,
        }
      : style === "orbit"
        ? {
            markTransform: "translate(90 92) scale(.65)",
            titleY: 105,
            detailY: 420,
            titleColor: palette.ink,
          }
        : {
            markTransform: "translate(102 100) scale(.6)",
            titleY: 82,
            detailY: 452,
            titleColor: palette.ink,
          };
  const center = marks[mark]
    .replaceAll("ACCENT", palette.accent)
    .replaceAll("INK", palette.ink);
  const labels =
    style === "orbit"
      ? `<defs><path id="orbit-top" d="M91 256a165 165 0 0 1 330 0"/><path id="orbit-bottom" d="M91 256a165 165 0 0 0 330 0"/></defs><text text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="3" fill="${palette.ink}"><textPath href="#orbit-top" startOffset="50%">${escapeXml(title || "EVENT POAP")}</textPath></text><text text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="2" fill="${palette.ink}"><textPath href="#orbit-bottom" startOffset="50%">${escapeXml(detail || "BASE · 2026")}</textPath></text>`
      : `<text x="256" y="${layout.titleY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="3" fill="${layout.titleColor}">${escapeXml(title || "EVENT POAP")}</text><text x="256" y="${layout.detailY}" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="2" fill="${palette.ink}">${escapeXml(detail || "BASE · 2026")}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${palette.background}"/>${frame}<g transform="${layout.markTransform}">${center}</g>${labels}</svg>`;
}

export function ArtworkStudio({
  onChange,
}: {
  onChange: (svg: string) => void;
}) {
  const [mode, setMode] = useState<"build" | "source">("build");
  const [style, setStyle] = useState("split");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [mark, setMark] = useState<keyof typeof marks>("spark");
  const [title, setTitle] = useState("EVENT POAP");
  const [detail, setDetail] = useState("BASE · 2026");
  const [source, setSource] = useState("");
  const generated = useMemo(
    () =>
      makeSvg({ style, palette: palettes[paletteIndex], mark, title, detail }),
    [style, paletteIndex, mark, title, detail],
  );
  const activeSvg = mode === "build" ? generated : source;

  useEffect(() => onChange(activeSvg), [activeSvg, onChange]);

  function upload(file?: File) {
    if (!file) return;
    file.text().then((text) => {
      if (!text.trim().startsWith("<svg")) {
        window.alert("Choose a raw SVG file, not a PNG or JPEG.");
        return;
      }
      setSource(text);
      setMode("source");
    });
  }

  const preview = activeSvg.trim().startsWith("<svg")
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(activeSvg)}`
    : "";

  return (
    <div className="artwork-studio panel">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">BADGE WORKSHOP</span>
          <h2>Make the artwork here</h2>
          <p>Build a compact SVG or bring one you already designed.</p>
        </div>
        <div className="studio-tabs" aria-label="Artwork source">
          <button
            className={mode === "build" ? "active" : ""}
            onClick={() => setMode("build")}
          >
            Build
          </button>
          <button
            className={mode === "source" ? "active" : ""}
            onClick={() => setMode("source")}
          >
            Upload or paste
          </button>
        </div>
      </div>

      <div className="studio-layout">
        <div className="studio-preview">
          {preview ? (
            <img src={preview} alt="Generated POAP artwork" />
          ) : (
            <div className="studio-empty">Paste a valid SVG to preview it.</div>
          )}
          <strong>
            {new TextEncoder().encode(activeSvg).length.toLocaleString()} bytes
          </strong>
          <span>Smaller artwork costs less gas to register.</span>
        </div>

        {mode === "build" ? (
          <div className="studio-controls">
            <fieldset>
              <legend>Layout</legend>
              <div className="choice-row">
                {[
                  ["split", "Signal block"],
                  ["orbit", "Orbit"],
                  ["grid", "Grid pass"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={style === value ? "active" : ""}
                    onClick={() => setStyle(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Palette</legend>
              <div className="palette-row">
                {palettes.map((palette, index) => (
                  <button
                    key={palette.name}
                    className={paletteIndex === index ? "active" : ""}
                    aria-label={palette.name}
                    title={palette.name}
                    onClick={() => setPaletteIndex(index)}
                    style={{
                      background: `linear-gradient(135deg, ${palette.background} 50%, ${palette.accent} 50%)`,
                    }}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Center mark</legend>
              <div className="choice-row mark-row">
                {(
                  [
                    ["spark", "Spark"],
                    ["check", "Check"],
                    ["pin", "Place"],
                    ["bolt", "Bolt"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    className={mark === value ? "active" : ""}
                    onClick={() => setMark(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="studio-fields">
              <label>
                Top line <b>{title.length}/24</b>
                <input
                  value={title}
                  maxLength={24}
                  onChange={(event) =>
                    setTitle(event.target.value.toUpperCase())
                  }
                />
              </label>
              <label>
                Bottom line <b>{detail.length}/28</b>
                <input
                  value={detail}
                  maxLength={28}
                  onChange={(event) =>
                    setDetail(event.target.value.toUpperCase())
                  }
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="source-controls">
            <label className="upload compact">
              <Upload />
              <strong>Choose an SVG file</strong>
              <input
                hidden
                type="file"
                accept=".svg,image/svg+xml"
                onChange={(event) => upload(event.target.files?.[0])}
              />
            </label>
            <label>
              <span>
                <Code2 size={17} /> Raw SVG source
              </span>
              <textarea
                className="mono"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder={
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">…</svg>'
                }
              />
            </label>
            <small>
              Remote images, fonts, and scripts may not render in wallets. Keep
              every asset inside the SVG.
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
