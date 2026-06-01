export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export function toPascal(s: string): string {
  return s
    .charAt(0)
    .toUpperCase()
    .concat(
      s.slice(1).replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()),
    );
}

export function uniqueName(base: string, usedNames: Set<string>): string {
  const name = toPascal(base);

  if (!usedNames.has(name)) {
    usedNames.add(name);

    return name;
  }

  let i = 2;

  while (usedNames.has(`${name}${i}`)) i++;
  usedNames.add(`${name}${i}`);

  return `${name}${i}`;
}

export function needsQuoting(key: string): boolean {
  return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
}

export function getType(
  value: JsonValue,
  hint: string,
  interfaces: string[],
  usedNames: Set<string>,
  optionalFields: boolean,
): string {
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const seen = new Set<string>();
    const seenStructures = new Map<string, string>();
    const elHint = hint.replace(/s$/i, "");

    value.forEach((el) => {
      if (el !== null && typeof el === "object" && !Array.isArray(el)) {
        const fingerprint = JSON.stringify(Object.keys(el).sort());

        if (seenStructures.has(fingerprint)) {
          seen.add(seenStructures.get(fingerprint)!);
        } else {
          const typeName = getType(el, elHint, interfaces, usedNames, optionalFields);

          seenStructures.set(fingerprint, typeName);
          seen.add(typeName);
        }
      } else {
        seen.add(getType(el, elHint, interfaces, usedNames, optionalFields));
      }
    });
    const union = [...seen].join(" | ");

    return seen.size > 1 ? `(${union})[]` : `${union}[]`;
  }

  const name = uniqueName(hint, usedNames);
  const fields = Object.entries(value)
    .map(([k, v]) => {
      const quotedKey = needsQuoting(k) ? `"${k}"` : k;

      return `  ${quotedKey}${optionalFields ? "?" : ""}: ${getType(v, k, interfaces, usedNames, optionalFields)};`;
    })
    .join("\n");

  interfaces.push(`interface ${name} {\n${fields}\n}`);

  return name;
}

export interface JsonToTsOptions {
  input: string;
  rootName: string;
  optional: boolean;
}

export function jsonToTs(input: string, rootName: string, optional: boolean): string {
  const parsed = JSON.parse(input) as JsonValue;
  const interfaces: string[] = [];
  const usedNames = new Set<string>();

  const rootIsArray = Array.isArray(parsed);

  let elementHint = rootName;

  if (rootIsArray) {
    const singularised = rootName.replace(/s$/i, "");

    elementHint = singularised !== rootName ? singularised : rootName + "Item";
  }

  const rootType = getType(parsed, rootIsArray ? elementHint : rootName, interfaces, usedNames, optional);

  if (!interfaces.length) {
    return `type ${toPascal(rootName)} = ${rootType};`;
  }

  const body = interfaces.reverse().join("\n\n");

  if (rootIsArray) {
    return `${body}\n\ntype ${toPascal(rootName)} = ${rootType};`;
  }

  return body;
}
