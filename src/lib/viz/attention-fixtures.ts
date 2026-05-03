/** Synthetic but plausible attention fixtures across a few sentences.
 *  Each "head" implements a different pattern (next-token, previous-token,
 *  punctuation, content-word, induction-like, etc.) so users can flip heads
 *  and see how distinct attention behaviors look. */

const SENTENCES = [
  "The cat sat on the mat .".split(" "),
  "Attention is all you need .".split(" "),
  "The trophy did n't fit in the suitcase because it was too big .".split(" "),
  "Born in Paris , she later moved to London .".split(" "),
];

export const SAMPLES = SENTENCES.map((toks, i) => ({
  id: `s${i}`,
  label: toks.join(" "),
  tokens: toks,
}));

export type AttnPattern = (i: number, j: number, n: number, tokens: string[]) => number;

const PATTERNS: { name: string; fn: AttnPattern }[] = [
  {
    name: "previous-token",
    fn: (i, j) => (j === Math.max(0, i - 1) ? 1.0 : 0.05),
  },
  {
    name: "next-token",
    fn: (i, j, n) => (j === Math.min(n - 1, i + 1) ? 1.0 : 0.06),
  },
  {
    name: "self",
    fn: (i, j) => (i === j ? 0.85 : 0.05),
  },
  {
    name: "first-token",
    fn: (i, j) => (j === 0 ? 0.9 : 0.04),
  },
  {
    name: "to-noun",
    fn: (i, j, _, tokens) => {
      const isNounish = (t: string) =>
        ["cat", "mat", "trophy", "suitcase", "Paris", "London", "Attention"].includes(t);
      return isNounish(tokens[j] || "") ? 0.9 : 0.05;
    },
  },
  {
    name: "to-punct",
    fn: (i, j, _, tokens) => ([",", ".", "?", "!"].includes(tokens[j]) ? 0.85 : 0.04),
  },
  {
    name: "coreference",
    fn: (i, j, _, tokens) => {
      // a (very rough) coreference head: "it" attends to first noun;
      // "she" attends to "Paris" or earliest capitalized noun.
      const t = tokens[i];
      if (t === "it") {
        const target = tokens.findIndex((x) => x === "trophy");
        return j === target ? 0.95 : 0.03;
      }
      if (t === "she") {
        const target = tokens.findIndex((x) => x === "Paris");
        return j === target ? 0.95 : 0.03;
      }
      // diagonal fallback
      return j === i ? 0.4 : 0.05;
    },
  },
  {
    name: "uniform-mix",
    fn: () => 0.3,
  },
  {
    name: "induction-prev2",
    fn: (i, j) => (j === Math.max(0, i - 2) ? 0.85 : 0.06),
  },
  {
    name: "to-content-words",
    fn: (i, j, _, tokens) => {
      const t = tokens[j] ?? "";
      const isContent = t.length > 3 && !["the", "n't", "and", "but", "she", "you", "all", "for"].includes(t.toLowerCase());
      return isContent ? 0.7 : 0.05;
    },
  },
  {
    name: "rare-token",
    fn: (i, j, _, tokens) => {
      const rare = ["trophy", "suitcase", "Paris", "London"];
      return rare.includes(tokens[j]) ? 0.9 : 0.03;
    },
  },
  {
    name: "bigram-merge",
    fn: (i, j) => Math.exp(-Math.pow((j - i + 0.5), 2) / 0.5),
  },
];

const LAYER_COUNT = 6;
const HEAD_COUNT = 8;

export function getAttention(sentenceId: string, layer: number, head: number): number[][] {
  const sample = SAMPLES.find((s) => s.id === sentenceId)!;
  const n = sample.tokens.length;
  const pat = PATTERNS[(layer * HEAD_COUNT + head) % PATTERNS.length];
  const raw: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      // causal mask
      if (j > i) return 0;
      const v = pat.fn(i, j, n, sample.tokens);
      return v;
    })
  );
  // softmax row-wise
  for (let i = 0; i < n; i++) {
    const max = Math.max(...raw[i]);
    let s = 0;
    for (let j = 0; j < n; j++) {
      raw[i][j] = j > i ? 0 : Math.exp(raw[i][j] - max);
      s += raw[i][j];
    }
    if (s > 0) for (let j = 0; j < n; j++) raw[i][j] /= s;
  }
  return raw;
}

export const ATTENTION_LAYERS = LAYER_COUNT;
export const ATTENTION_HEADS = HEAD_COUNT;
export function patternName(layer: number, head: number) {
  return PATTERNS[(layer * HEAD_COUNT + head) % PATTERNS.length].name;
}
