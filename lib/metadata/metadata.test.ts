import { describe, expect, it } from "vitest";
import { decodeMetadata, svgFromDataImage } from "./metadata";

describe("decodeMetadata", () => {
  it("decodes UTF-8 punctuation and international characters", () => {
    const metadata = {
      name: "Onchain POAPs Launch",
      description: "Studio—a simple event in Jakarta 🎉",
      image: "data:image/svg+xml;base64,PHN2Zy8+",
    };
    const uri = `data:application/json;base64,${Buffer.from(
      JSON.stringify(metadata),
      "utf8",
    ).toString("base64")}`;

    expect(decodeMetadata(uri)).toEqual(metadata);
  });

  it("recovers immutable metadata containing raw control characters", () => {
    const malformedJson =
      '{"name":"Community POAP","description":"first line\nsecond line","image":"data:image/svg+xml;base64,PHN2Zy8+"}';
    const uri = `data:application/json;base64,${Buffer.from(
      malformedJson,
      "utf8",
    ).toString("base64")}`;

    expect(decodeMetadata(uri)).toEqual({
      name: "Community POAP",
      description: "first line\nsecond line",
      image: "data:image/svg+xml;base64,PHN2Zy8+",
    });
  });

  it("normalizes malformed SVG namespaces from immutable metadata", () => {
    const metadata = {
      name: "LoreFi",
      description: "United in stillness",
      image: `data:image/svg+xml;base64,${Buffer.from(
        '<svg xmlns="http://w3.org" viewBox="0 0 500 500"><rect width="500" height="500" fill="#20A4F3"/></svg>',
        "utf8",
      ).toString("base64")}`,
    };
    const uri = `data:application/json;base64,${Buffer.from(
      JSON.stringify(metadata),
      "utf8",
    ).toString("base64")}`;

    const decoded = decodeMetadata(uri);

    expect(decoded.image).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    expect(svgFromDataImage(decoded.image)).toContain(
      'xmlns="http://www.w3.org/2000/svg"',
    );
  });

  it("adds a namespace to SVG data images missing one", () => {
    const metadata = {
      name: "Plain SVG",
      description: "",
      image: "data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2010%2010%22%3E%3C%2Fsvg%3E",
    };
    const uri = `data:application/json;base64,${Buffer.from(
      JSON.stringify(metadata),
      "utf8",
    ).toString("base64")}`;

    const decoded = decodeMetadata(uri);

    expect(svgFromDataImage(decoded.image)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
    );
  });
});
