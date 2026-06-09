import { describe, expect, it } from "vitest";
import { toJsx, ATTR_MAP, SELF_CLOSING_TAGS } from "@/lib/svg-jsx";

describe("toJsx", () => {
  it("converts a simple SVG to JSX", () => {
    const input = '<svg width="24" height="24"><circle cx="12" cy="12" r="10"/></svg>';
    const result = toJsx(input);

    expect(result).toContain("export default function Icon");
    expect(result).toContain("<svg");
    expect(result).toContain("/>");
  });

  it("removes XML declarations", () => {
    const input = '<?xml version="1.0"?><svg></svg>';
    const result = toJsx(input);

    expect(result).not.toContain("<?xml");
  });

  it("removes DOCTYPE declarations", () => {
    const input = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"><svg></svg>';
    const result = toJsx(input);

    expect(result).not.toContain("<!DOCTYPE");
  });

  it("removes XML namespaces", () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const result = toJsx(input);

    expect(result).not.toContain("xmlns");
  });

  it("converts hyphenated attributes to camelCase", () => {
    const input = '<svg stroke-width="2" stroke-linecap="round"></svg>';
    const result = toJsx(input);

    expect(result).toContain("strokeWidth");
    expect(result).toContain("strokeLinecap");
  });

  it("converts class to className", () => {
    const input = '<svg><circle class="foo"/></svg>';
    const result = toJsx(input);

    expect(result).toContain("className");
  });

  it("converts for to htmlFor", () => {
    const input = '<svg><label for="input"></label></svg>';
    const result = toJsx(input);

    expect(result).toContain("htmlFor");
  });

  it("converts style strings to JSX style objects", () => {
    const input = '<svg style="color: red; font-size: 14px"></svg>';
    const result = toJsx(input);

    expect(result).toContain("style={{");
    expect(result).toContain("color:");
    expect(result).toContain('"red"');
    expect(result).toContain("fontSize:");
    expect(result).toContain('"14px"');
  });

  it("does not double-close tags that already have closing tags", () => {
    const input = '<svg><circle cx="12" cy="12" r="10"></circle></svg>';
    const result = toJsx(input);

    expect(result).toContain("</circle>");
  });

  it("converts regular SVG to JSX without breaking structure", () => {
    const input = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
    const result = toJsx(input);

    expect(result).toContain("viewBox");
    expect(result).toContain("export default function");
  });

  it("wraps in a component template", () => {
    const input = '<svg></svg>';
    const result = toJsx(input);

    expect(result).toBe(
      "export default function Icon(props) {\n  return (\n  <svg></svg>\n  );\n}",
    );
  });

  it("handles empty input", () => {
    const result = toJsx("");

    expect(result).toContain("export default function Icon(props)");
    expect(result).toContain("return (");
  });
});

describe("ATTR_MAP", () => {
  it("has SVG-specific entries", () => {
    expect(ATTR_MAP["stroke-width"]).toBe("strokeWidth");
    expect(ATTR_MAP["clip-path"]).toBe("clipPath");
    expect(ATTR_MAP["fill-opacity"]).toBe("fillOpacity");
  });

  it("has HTML-to-JSX entries", () => {
    expect(ATTR_MAP.class).toBe("className");
    expect(ATTR_MAP.for).toBe("htmlFor");
  });
});

describe("SELF_CLOSING_TAGS", () => {
  it("includes basic SVG void elements", () => {
    expect(SELF_CLOSING_TAGS).toContain("circle");
    expect(SELF_CLOSING_TAGS).toContain("path");
    expect(SELF_CLOSING_TAGS).toContain("line");
  });
});
