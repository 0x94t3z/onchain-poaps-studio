export type SvgValidation = { valid: true } | { valid: false; error: string };

export function validateSvgSource(source: string): SvgValidation {
  const svg = source.trim();
  if (!svg) return { valid: false, error: "Add or build SVG artwork." };
  if (!/^<svg(?:\s|>)/i.test(svg) || !/<\/svg>\s*$/i.test(svg))
    return { valid: false, error: "Artwork must be one complete SVG element." };
  if (/<(?:script|foreignObject|iframe|object|embed)(?:\s|>)/i.test(svg))
    return {
      valid: false,
      error: "Remove scripts, embedded HTML, and external documents from the SVG.",
    };
  if (/\son[a-z]+\s*=/i.test(svg))
    return { valid: false, error: "Remove event-handler attributes from the SVG." };
  if (/(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|data:text\/html)/i.test(svg))
    return {
      valid: false,
      error: "Keep every asset inside the SVG; remote links are not supported.",
    };
  if (/url\(\s*["']?\s*(?:https?:|\/\/)/i.test(svg))
    return {
      valid: false,
      error: "Remove remote CSS resources from the SVG.",
    };
  return { valid: true };
}
