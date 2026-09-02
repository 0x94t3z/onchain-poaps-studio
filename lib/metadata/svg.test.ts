import { describe, expect, it } from "vitest";
import { validateSvgSource } from "./svg";

describe("SVG validation", () => {
  it("accepts a self-contained SVG", () => {
    expect(
      validateSvgSource(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" /></svg>',
      ),
    ).toEqual({ valid: true });
  });

  it.each([
    '<svg><script>alert(1)</script></svg>',
    '<svg><foreignObject><div>HTML</div></foreignObject></svg>',
    '<svg onload="alert(1)"></svg>',
    '<svg><image href="https://example.com/image.png" /></svg>',
    '<svg><style>rect{fill:url(https://example.com/a.svg)}</style></svg>',
  ])("rejects unsafe or external SVG content", (source) => {
    expect(validateSvgSource(source).valid).toBe(false);
  });

  it("rejects partial markup", () => {
    expect(validateSvgSource("<svg>").valid).toBe(false);
  });
});
