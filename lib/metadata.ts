export type Metadata = {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
};

const METADATA_PREFIX = "data:application/json;base64,";

export function decodeMetadata(uri: string): Metadata {
  if (!uri.startsWith(METADATA_PREFIX)) {
    throw new Error("Unsupported token metadata URI");
  }

  const binary = atob(uri.slice(METADATA_PREFIX.length));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export const short = (value: string, n = 5) =>
  `${value.slice(0, n + 2)}…${value.slice(-n)}`;

export function deadline(createdAt: bigint, days: number) {
  return Number(createdAt) + days * 86400;
}

export function remaining(until: number) {
  const seconds = until - Math.floor(Date.now() / 1000);
  if (seconds <= 0) return "Expired";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d ? `${d}d ${h}h left` : `${h}h left`;
}
