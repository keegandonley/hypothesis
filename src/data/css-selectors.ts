export interface CssSelector {
  selector: string;
  description: string;
  example: string;
  specificity: string;
}

export interface CssSelectorGroup {
  id: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  selectors: CssSelector[];
}

export const CSS_SELECTOR_GROUPS: CssSelectorGroup[] = [
  {
    id: "basic",
    label: "Basic",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    selectors: [
      { selector: "*", description: "Universal selector — matches any element.", example: "* { box-sizing: border-box; }", specificity: "0,0,0" },
      { selector: "element", description: "Type selector — matches all elements of the given tag name.", example: "p { margin: 0; }", specificity: "0,0,1" },
      { selector: ".class", description: "Class selector — matches elements with the specified class attribute.", example: ".card { padding: 16px; }", specificity: "0,1,0" },
      { selector: "#id", description: "ID selector — matches the element with the given id attribute. IDs must be unique per page.", example: "#header { position: sticky; }", specificity: "1,0,0" },
    ],
  },
  {
    id: "attribute",
    label: "Attribute",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    selectors: [
      { selector: "[attr]", description: "Presence — matches elements that have the attribute, regardless of value.", example: "a[href] { color: blue; }", specificity: "0,1,0" },
      { selector: "[attr=val]", description: "Exact match — matches elements where the attribute equals the exact value.", example: 'input[type="text"]', specificity: "0,1,0" },
      { selector: "[attr~=val]", description: "Word match — matches elements where the attribute contains val as a space-separated word.", example: '[class~="active"]', specificity: "0,1,0" },
      { selector: "[attr|=val]", description: "Hyphen match — matches val or val followed by a hyphen. Designed for language codes like lang|=en.", example: '[lang|="en"]', specificity: "0,1,0" },
      { selector: "[attr^=val]", description: "Prefix match — matches elements where the attribute value starts with val.", example: 'a[href^="https"]', specificity: "0,1,0" },
      { selector: "[attr$=val]", description: "Suffix match — matches elements where the attribute value ends with val.", example: 'a[href$=".pdf"]', specificity: "0,1,0" },
      { selector: "[attr*=val]", description: "Substring match — matches elements where the attribute value contains val anywhere.", example: '[class*="icon"]', specificity: "0,1,0" },
    ],
  },
  {
    id: "pseudo-class",
    label: "Pseudo-class",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    selectors: [
      { selector: ":hover", description: "Matches when the user's pointer is over the element.", example: "a:hover { text-decoration: underline; }", specificity: "+0,1,0" },
      { selector: ":focus", description: "Matches when the element has keyboard focus.", example: "input:focus { outline: 2px solid blue; }", specificity: "+0,1,0" },
      { selector: ":active", description: "Matches while the element is being activated (e.g., during a click).", example: "button:active { transform: scale(0.98); }", specificity: "+0,1,0" },
      { selector: ":visited", description: "Matches anchor elements that have been visited. Styling is restricted to prevent history sniffing.", example: "a:visited { color: purple; }", specificity: "+0,1,0" },
      { selector: ":first-child", description: "Matches an element that is the first child of its parent.", example: "li:first-child { font-weight: bold; }", specificity: "+0,1,0" },
      { selector: ":last-child", description: "Matches an element that is the last child of its parent.", example: "li:last-child { border-bottom: none; }", specificity: "+0,1,0" },
      { selector: ":nth-child(n)", description: "Matches elements based on their position. Accepts keywords (odd, even) or formulas (2n+1).", example: "tr:nth-child(even) { background: #f5f5f5; }", specificity: "+0,1,0" },
      { selector: ":nth-of-type(n)", description: "Like :nth-child but only counts siblings of the same element type.", example: "p:nth-of-type(2) { color: gray; }", specificity: "+0,1,0" },
      { selector: ":not(selector)", description: "Negation — matches elements that do not match the argument selector.", example: "input:not([type='submit'])", specificity: "+specificity of argument" },
      { selector: ":is(sel, ...)", description: "Matches any element that matches one of the selectors in the list. Forgiving — ignores invalid selectors.", example: ":is(h1, h2, h3) { font-weight: bold; }", specificity: "+highest specificity in list" },
      { selector: ":where(sel, ...)", description: "Like :is() but contributes zero specificity — useful for low-priority base styles.", example: ":where(ul, ol) { padding-left: 1.5em; }", specificity: "0,0,0" },
      { selector: ":has(selector)", description: "Relational pseudo-class — matches elements that contain a descendant matching the argument. ('parent selector')", example: "div:has(img) { display: grid; }", specificity: "+specificity of argument" },
      { selector: ":checked", description: "Matches checkboxes, radio buttons, and options that are currently selected.", example: "input:checked + label { color: green; }", specificity: "+0,1,0" },
      { selector: ":disabled", description: "Matches form elements that are disabled.", example: "button:disabled { opacity: 0.5; }", specificity: "+0,1,0" },
      { selector: ":empty", description: "Matches elements that have no children (no text nodes either).", example: "p:empty { display: none; }", specificity: "+0,1,0" },
      { selector: ":root", description: "Matches the document root element — in HTML, this is <html>. Higher specificity than html selector.", example: ":root { --spacing: 8px; }", specificity: "0,1,0" },
    ],
  },
  {
    id: "pseudo-element",
    label: "Pseudo-element",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    selectors: [
      { selector: "::before", description: "Creates a pseudo-element as the first child of the selected element. Requires content property.", example: '.icon::before { content: "▶"; }', specificity: "+0,0,1" },
      { selector: "::after", description: "Creates a pseudo-element as the last child of the selected element. Requires content property.", example: 'a::after { content: " ↗"; }', specificity: "+0,0,1" },
      { selector: "::first-line", description: "Matches the first rendered line of a block element. Only certain properties apply.", example: "p::first-line { font-variant: small-caps; }", specificity: "+0,0,1" },
      { selector: "::first-letter", description: "Matches the first letter (or character) of a block element. Used for drop cap effects.", example: "p::first-letter { font-size: 3em; float: left; }", specificity: "+0,0,1" },
      { selector: "::placeholder", description: "Matches the placeholder text of an input or textarea.", example: "input::placeholder { color: #aaa; }", specificity: "+0,0,1" },
      { selector: "::selection", description: "Matches the portion of text selected by the user.", example: "::selection { background: #ff0; color: #000; }", specificity: "+0,0,0" },
      { selector: "::marker", description: "Matches the marker box of a list item (bullet or number).", example: "li::marker { color: var(--accent); }", specificity: "+0,0,1" },
    ],
  },
  {
    id: "combinators",
    label: "Combinators",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    selectors: [
      { selector: "A B", description: "Descendant combinator — matches B that is anywhere inside A (not just direct children).", example: "nav a { color: white; }", specificity: "sum of A and B" },
      { selector: "A > B", description: "Child combinator — matches B that is a direct child of A only.", example: "ul > li { list-style: disc; }", specificity: "sum of A and B" },
      { selector: "A + B", description: "Adjacent sibling combinator — matches B that immediately follows A (same parent).", example: "h2 + p { margin-top: 0; }", specificity: "sum of A and B" },
      { selector: "A ~ B", description: "General sibling combinator — matches all B elements that follow A (same parent, not just adjacent).", example: "h2 ~ p { color: gray; }", specificity: "sum of A and B" },
      { selector: "A, B", description: "Selector list — matches both A and B. A comma-separated list of selectors sharing the same rules.", example: "h1, h2, h3 { line-height: 1.2; }", specificity: "each evaluated separately" },
    ],
  },
];
