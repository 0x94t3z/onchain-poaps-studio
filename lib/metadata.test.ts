import { describe, expect, it } from "vitest";
import { decodeMetadata } from "./metadata";

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
});
