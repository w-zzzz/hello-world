/** Generate a deterministic 3D embedding-like dataset of ~600 points across 8
 *  semantic clusters (animals, food, music, sports, places, science, emotions, time)
 *  with words and labels. This stands in for a real GloVe→UMAP run. */

const CATEGORIES: { label: string; words: string[]; center: [number, number, number]; hue: number }[] = [
  {
    label: "animals",
    center: [-1.2, 0.6, 0.4],
    hue: 30,
    words: ["cat", "dog", "horse", "lion", "tiger", "wolf", "rabbit", "bear", "fox", "deer", "eagle", "hawk", "owl", "shark", "whale", "dolphin", "salmon", "turtle", "lizard", "frog", "butterfly", "spider", "bee", "ant"],
  },
  {
    label: "food",
    center: [1.0, 0.4, -1.1],
    hue: 70,
    words: ["bread", "pasta", "rice", "pizza", "burger", "salad", "sushi", "soup", "cheese", "butter", "yogurt", "milk", "coffee", "tea", "juice", "wine", "beer", "apple", "banana", "orange", "grape", "lemon", "berry", "mango"],
  },
  {
    label: "music",
    center: [-0.4, 1.4, -0.8],
    hue: 200,
    words: ["piano", "guitar", "drums", "violin", "cello", "flute", "trumpet", "saxophone", "bass", "synth", "rhythm", "melody", "harmony", "chord", "tempo", "beat", "song", "lyric", "verse", "chorus", "album", "concert", "stage", "band"],
  },
  {
    label: "sports",
    center: [1.4, -1.0, 0.8],
    hue: 150,
    words: ["soccer", "basketball", "tennis", "baseball", "football", "hockey", "rugby", "cricket", "golf", "swimming", "running", "cycling", "climbing", "skiing", "surfing", "boxing", "wrestling", "marathon", "stadium", "coach", "athlete", "league", "score", "trophy"],
  },
  {
    label: "places",
    center: [0.0, -1.3, -1.0],
    hue: 260,
    words: ["paris", "london", "tokyo", "berlin", "rome", "madrid", "vienna", "moscow", "beijing", "delhi", "cairo", "sydney", "boston", "seattle", "chicago", "denver", "miami", "vancouver", "toronto", "lisbon", "athens", "prague", "oslo", "dublin"],
  },
  {
    label: "science",
    center: [-1.5, -0.7, -0.3],
    hue: 280,
    words: ["atom", "molecule", "electron", "neuron", "gene", "protein", "enzyme", "virus", "bacteria", "galaxy", "planet", "comet", "quantum", "relativity", "entropy", "fission", "orbit", "force", "energy", "vector", "matrix", "tensor", "gradient", "function"],
  },
  {
    label: "emotions",
    center: [0.6, 1.5, 0.9],
    hue: 350,
    words: ["happy", "sad", "angry", "calm", "anxious", "excited", "afraid", "proud", "ashamed", "jealous", "lonely", "loving", "kind", "tender", "joyful", "grateful", "surprised", "curious", "bored", "hopeful", "regret", "longing", "trust", "doubt"],
  },
  {
    label: "time",
    center: [1.3, 0.9, 1.4],
    hue: 100,
    words: ["second", "minute", "hour", "morning", "noon", "evening", "night", "dawn", "dusk", "yesterday", "today", "tomorrow", "monday", "friday", "spring", "summer", "autumn", "winter", "decade", "century", "moment", "future", "past", "present"],
  },
];

export type EmbPoint = {
  word: string;
  category: string;
  pos: [number, number, number];
  hue: number;
};

let cached: EmbPoint[] | null = null;

export function getEmbeddings(): EmbPoint[] {
  if (cached) return cached;
  const out: EmbPoint[] = [];
  // simple seeded PRNG so the layout is stable
  let seed = 1;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (const cat of CATEGORIES) {
    for (const w of cat.words) {
      const dx = (rand() - 0.5) * 0.6;
      const dy = (rand() - 0.5) * 0.6;
      const dz = (rand() - 0.5) * 0.6;
      out.push({
        word: w,
        category: cat.label,
        pos: [cat.center[0] + dx, cat.center[1] + dy, cat.center[2] + dz],
        hue: cat.hue,
      });
    }
  }
  cached = out;
  return out;
}

export const CATEGORY_LIST = CATEGORIES.map((c) => ({ label: c.label, hue: c.hue }));
