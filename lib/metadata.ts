export type Metadata = {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
};

const METADATA_PREFIX = "data:application/json;base64,";

// A few immutable registrations contain literal control characters inside
// JSON strings. Escape those characters while leaving valid JSON whitespace
// outside strings untouched.
function escapeControlCharacters(json: string) {
  let escaped = "";
  let inString = false;
  let isEscaped = false;

  for (const character of json) {
    if (inString && character.charCodeAt(0) <= 0x1f) {
      escaped += `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
      isEscaped = false;
      continue;
    }

    escaped += character;
    if (isEscaped) {
      isEscaped = false;
    } else if (character === "\\" && inString) {
      isEscaped = true;
    } else if (character === '"') {
      inString = !inString;
    }
  }

  return escaped;
}

export function decodeMetadata(uri: string): Metadata {
  if (!uri.startsWith(METADATA_PREFIX)) {
    throw new Error("Unsupported token metadata URI");
  }

  const binary = atob(uri.slice(METADATA_PREFIX.length));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);

  try {
    return JSON.parse(json);
  } catch {
    return JSON.parse(escapeControlCharacters(json));
  }
}

export const short = (value: string, n = 5) =>
  `${value.slice(0, n + 2)}…${value.slice(-n)}`;

export function deadline(createdAt: bigint, days: number) {
  return Number(createdAt) + days * 86400;
}

export function remaining(until: number, now: number) {
  if (!now) return "Checking…";
  const seconds = until - now;
  if (seconds <= 0) return "Expired";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d ? `${d}d ${h}h left` : `${h}h left`;
}
