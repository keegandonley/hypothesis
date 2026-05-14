export interface PgOperator {
  operator: string;
  description: string;
  example: string;
  since?: string;
}

export interface PgOperatorGroup {
  id: string;
  label: string;
  badge: string;
  color: string;
  subtle: string;
  border: string;
  operators: PgOperator[];
}

export const PG_OPERATOR_GROUPS: PgOperatorGroup[] = [
  {
    id: "jsonb-access",
    label: "JSONB Access",
    badge: "JSONB Access",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    operators: [
      {
        operator: "->",
        description:
          "Extract a JSON object field by key, or an array element by integer index. Returns jsonb. NULL if the key/index does not exist.",
        example: `'{"a": {"b": 1}}'::jsonb -> 'a'  →  {"b": 1}`,
      },
      {
        operator: "->",
        description:
          "Array element by integer index (zero-based; negative indexes count from the end).",
        example: `'[10, 20, 30]'::jsonb -> -1  →  30`,
      },
      {
        operator: "->>",
        description:
          "Extract a JSON object field (or array element) as text. Strips the surrounding JSON quotes for string values.",
        example: `'{"a": "hello"}'::jsonb ->> 'a'  →  hello`,
      },
      {
        operator: "#>",
        description:
          "Extract the JSON value at the given path. Path is a text[] of keys and/or array indexes. Returns jsonb.",
        example: `'{"a": {"b": {"c": 1}}}'::jsonb #> '{a,b,c}'  →  1`,
      },
      {
        operator: "#>>",
        description:
          "Extract the JSON value at the given path, returned as text. Strips JSON quotes from string values.",
        example: `'{"a": {"b": "hi"}}'::jsonb #>> '{a,b}'  →  hi`,
      },
    ],
  },
  {
    id: "jsonb-existence",
    label: "JSONB Existence",
    badge: "JSONB Existence",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    operators: [
      {
        operator: "?",
        description:
          "Does the text exist as a top-level key in the JSON object, or as an element of the JSON array? (Only checks the top level — does not recurse.) GIN-indexable with jsonb_ops or jsonb_path_ops.",
        example: `'{"a": 1, "b": 2}'::jsonb ? 'a'  →  true`,
      },
      {
        operator: "?|",
        description:
          "Do any of the strings in the text[] exist as top-level keys or array elements?",
        example: `'{"a": 1, "b": 2}'::jsonb ?| array['c', 'b']  →  true`,
      },
      {
        operator: "?&",
        description:
          "Do all of the strings in the text[] exist as top-level keys or array elements?",
        example: `'{"a": 1, "b": 2}'::jsonb ?& array['a', 'b']  →  true`,
      },
    ],
  },
  {
    id: "jsonb-containment",
    label: "JSONB Containment",
    badge: "JSONB Containment",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    operators: [
      {
        operator: "@>",
        description:
          "Does the left JSONB value contain the right one? An object contains another if it has all the same key/value pairs (recursively). An array contains another if every element of the right array appears in the left array. GIN-indexable.",
        example: `'{"a": 1, "b": 2}'::jsonb @> '{"a": 1}'::jsonb  →  true`,
      },
      {
        operator: "<@",
        description:
          "Is the left JSONB value contained within the right? Mirror image of @>.",
        example: `'{"a": 1}'::jsonb <@ '{"a": 1, "b": 2}'::jsonb  →  true`,
      },
    ],
  },
  {
    id: "jsonb-mod",
    label: "JSONB Modification",
    badge: "JSONB Modification",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    operators: [
      {
        operator: "||",
        description:
          "Concatenate two JSONB values. Objects are merged at the top level only — keys in the right operand overwrite keys in the left. Arrays are concatenated. Mixing object + scalar wraps both in an array.",
        example: `'{"a": 1}'::jsonb || '{"b": 2}'::jsonb  →  {"a": 1, "b": 2}`,
      },
      {
        operator: "-",
        description:
          "Delete a key/value pair from a JSONB object (right operand is text), or delete an array element (right operand is an integer).",
        example: `'{"a": 1, "b": 2}'::jsonb - 'a'  →  {"b": 2}`,
      },
      {
        operator: "-",
        description: "Delete multiple keys at once by passing a text[].",
        example: `'{"a": 1, "b": 2, "c": 3}'::jsonb - array['a', 'b']  →  {"c": 3}`,
      },
      {
        operator: "#-",
        description:
          "Delete the field or array element at the specified path. Path is a text[] of keys and/or array indexes.",
        example: `'{"a": {"b": 1, "c": 2}}'::jsonb #- '{a,b}'  →  {"a": {"c": 2}}`,
      },
    ],
  },
  {
    id: "jsonb-path",
    label: "JSONB Path",
    badge: "JSONB Path",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    operators: [
      {
        operator: "@?",
        description:
          "Does the jsonpath query return any item for the JSON value? (Predicate that checks for existence of matches.)",
        example: `'{"a": [1, 2, 3]}'::jsonb @? '$.a[*] ? (@ > 1)'  →  true`,
        since: "12+",
      },
      {
        operator: "@@",
        description:
          "Evaluate a jsonpath predicate against the JSON value. Returns true, false, or NULL (when the path returns no items or the result is not boolean).",
        example: `'{"a": 2}'::jsonb @@ '$.a > 1'  →  true`,
        since: "12+",
      },
    ],
  },
  {
    id: "array-containment",
    label: "Array Containment",
    badge: "Array Containment",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    operators: [
      {
        operator: "@>",
        description:
          "Does the left array contain the right one? True when every element of the right array appears somewhere in the left array (ignoring order and duplicates). GIN-indexable.",
        example: `ARRAY[1, 2, 3] @> ARRAY[2, 1]  →  true`,
      },
      {
        operator: "<@",
        description:
          "Is the left array contained by the right one? Mirror image of @>.",
        example: `ARRAY[2, 1] <@ ARRAY[1, 2, 3]  →  true`,
      },
      {
        operator: "&&",
        description:
          "Do the arrays overlap — that is, share at least one element in common? GIN-indexable.",
        example: `ARRAY[1, 2, 3] && ARRAY[3, 4, 5]  →  true`,
      },
    ],
  },
  {
    id: "array-mod",
    label: "Array Concatenation & Comparison",
    badge: "Array Concatenation & Comparison",
    color: "#a78bfa",
    subtle: "#a78bfa18",
    border: "#a78bfa33",
    operators: [
      {
        operator: "||",
        description:
          "Concatenate two arrays into one. Multidimensional arrays must have compatible dimensions.",
        example: `ARRAY[1, 2] || ARRAY[3, 4]  →  {1, 2, 3, 4}`,
      },
      {
        operator: "||",
        description:
          "Prepend or append a single element to an array. The element type must match the array's element type.",
        example: `0 || ARRAY[1, 2]  →  {0, 1, 2}`,
      },
      {
        operator: "=",
        description:
          "Array equality. True when both arrays have the same dimensions and all corresponding elements are equal.",
        example: `ARRAY[1, 2, 3] = ARRAY[1, 2, 3]  →  true`,
      },
      {
        operator: "<>",
        description: "Array inequality. The negation of =.",
        example: `ARRAY[1, 2] <> ARRAY[1, 2, 3]  →  true`,
      },
      {
        operator: "<, >, <=, >=",
        description:
          "Lexicographic comparison of arrays. Compares element by element; the first unequal pair determines the result.",
        example: `ARRAY[1, 2, 3] < ARRAY[1, 2, 4]  →  true`,
      },
    ],
  },
];
