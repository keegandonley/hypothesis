export const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "eu",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
  "perspiciatis",
  "unde",
  "omnis",
  "iste",
  "natus",
  "error",
  "voluptatem",
  "accusantium",
  "doloremque",
  "laudantium",
  "totam",
  "rem",
  "aperiam",
  "eaque",
  "ipsa",
  "quae",
  "ab",
  "inventore",
  "veritatis",
  "quasi",
  "architecto",
  "beatae",
  "vitae",
  "dicta",
  "explicabo",
  "nemo",
  "ipsam",
  "quia",
  "voluptas",
  "aspernatur",
  "aut",
  "odit",
  "fugit",
  "consequuntur",
  "magni",
  "dolores",
  "eos",
  "ratione",
  "sequi",
  "nesciunt",
  "neque",
  "porro",
  "quisquam",
  "dolorem",
  "adipisci",
  "numquam",
  "eius",
  "modi",
  "tempora",
  "incidunt",
  "labore",
  "magnam",
  "quaerat",
  "soluta",
  "nobis",
  "eligendi",
  "optio",
  "cumque",
  "impedit",
  "quo",
  "minus",
  "maxime",
  "placeat",
  "facere",
  "possimus",
  "assumenda",
  "repellendus",
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWords(count: number): string {
  return Array.from({ length: count }, () => pick(WORDS)).join(" ");
}

function generateSentences(count: number): string {
  return Array.from({ length: count }, () => {
    const len = 8 + Math.floor(Math.random() * 8);
    const words = Array.from({ length: len }, () => pick(WORDS));

    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);

    return words.join(" ") + ".";
  }).join(" ");
}

function generateParagraphs(count: number): string {
  return Array.from({ length: count }, () => {
    const sentenceCount = 3 + Math.floor(Math.random() * 4);

    return generateSentences(sentenceCount);
  }).join("\n\n");
}

export type UnitType = "words" | "sentences" | "paragraphs";

export function generate(type: UnitType, count: number): string {
  switch (type) {
    case "words":
      return generateWords(count);
    case "sentences":
      return generateSentences(count);
    case "paragraphs":
      return generateParagraphs(count);
  }
}
