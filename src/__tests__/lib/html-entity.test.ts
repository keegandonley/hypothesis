import { describe, expect, it } from "vitest";
import { encodeHtmlEntities, decodeHtmlEntities } from "@/lib/html-entity";

describe("encodeHtmlEntities", () => {
  it("encodes special characters in 'special' mode", () => {
    expect(encodeHtmlEntities('<hello> & "world"', "special")).toBe(
      "&lt;hello&gt; &amp; &quot;world&quot;",
    );
  });

  it("encodes apostrophe in 'special' mode", () => {
    expect(encodeHtmlEntities("it's", "special")).toBe("it&apos;s");
  });

  it("encodes non-ASCII characters in 'non-ascii' mode", () => {
    expect(encodeHtmlEntities("café", "non-ascii")).toBe("caf&eacute;");
  });

  it("does not encode special chars in 'non-ascii' mode", () => {
    expect(encodeHtmlEntities("<hello>", "non-ascii")).toBe("<hello>");
  });

  it("encodes both special and non-ASCII in 'all' mode", () => {
    expect(encodeHtmlEntities("<café>", "all")).toBe("&lt;caf&eacute;&gt;");
  });

  it("returns empty string for empty input", () => {
    expect(encodeHtmlEntities("", "special")).toBe("");
  });

  it("encodes non-ASCII without named entity as numeric", () => {
    const result = encodeHtmlEntities("\u{1F600}", "non-ascii");
    expect(result).toBe("&#55357;&#56832;");
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes named entities", () => {
    expect(decodeHtmlEntities("&lt;hello&gt;")).toBe("<hello>");
  });

  it("decodes numeric decimal entities", () => {
    expect(decodeHtmlEntities("&#233;")).toBe("é");
  });

  it("decodes numeric hex entities", () => {
    expect(decodeHtmlEntities("&#xE9;")).toBe("é");
  });

  it("decodes mixed content", () => {
    expect(decodeHtmlEntities("&lt;caf&eacute;&gt;")).toBe("<café>");
  });

  it("returns empty string for empty input", () => {
    expect(decodeHtmlEntities("")).toBe("");
  });

  it("leaves unknown named entities unchanged", () => {
    expect(decodeHtmlEntities("&unknown;")).toBe("&unknown;");
  });

  it("round-trips through encode special / decode", () => {
    const original = "<hello> & \"world\"";
    expect(decodeHtmlEntities(encodeHtmlEntities(original, "special"))).toBe(original);
  });
});
