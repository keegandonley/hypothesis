export const ATTR_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  crossorigin: "crossOrigin",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  srcset: "srcSet",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-style": "fontStyle",
  "font-weight": "fontWeight",
  "marker-end": "markerEnd",
  "marker-mid": "markerMid",
  "marker-start": "markerStart",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-opacity": "strokeOpacity",
  "stroke-width": "strokeWidth",
  "text-anchor": "textAnchor",
  "xlink:href": "href",
  "xml:space": "xmlSpace",
};

export const SELF_CLOSING_TAGS = [
  "circle", "ellipse", "line", "path", "polygon", "polyline", "rect",
  "stop", "use", "image", "animateTransform", "animate", "set", "mpath",
  "tref", "feBlend", "feColorMatrix", "feComposite", "feConvolveMatrix",
  "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood",
  "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage",
  "feMergeNode", "feMorphology", "feOffset", "fePointLight",
  "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence",
];

export function toJsx(svg: string): string {
  let result = svg;

  result = result.replace(/<\?xml[^>]*\?>/g, "");
  result = result.replace(/<!DOCTYPE[^>]*>/gi, "");
  result = result.trim();

  result = result.replace(/\s+xmlns(?::[a-z]+)?="[^"]*"/g, "");

  for (const [html, jsx] of Object.entries(ATTR_MAP)) {
    const re = new RegExp(
      `\\b${html.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=`,
      "g",
    );

    result = result.replace(re, `${jsx}=`);
  }

  result = result.replace(/style="([^"]*)"/g, (_match, styleStr: string) => {
    const props = styleStr
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((decl) => {
        const [prop, ...rest] = decl.split(":");
        const value = rest.join(":").trim();
        const camel = prop
          .trim()
          .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        const jsValue =
          /^\d/.test(value) &&
          !value.includes("%") &&
          !value.includes("px") &&
          !value.includes("em")
            ? value
            : `"${value}"`;

        return `${camel}: ${jsValue}`;
      })
      .join(", ");

    return `style={{ ${props} }}`;
  });

  result = result.replace(
    new RegExp(
      `<(${SELF_CLOSING_TAGS.join("|")})(\\s[^>]*)?>(?!<\\/)`,
      "g",
    ),
    (_, tag, attrs = "") => `<${tag}${attrs} />`,
  );

  const componentBody = result
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");

  return `export default function Icon(props) {\n  return (\n${componentBody}\n  );\n}`;
}
