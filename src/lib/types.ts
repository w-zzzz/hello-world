export type PartSlug =
  | "01-math"
  | "02-classical-ml"
  | "03-deep-learning"
  | "04-transformers-llms"
  | "05-reasoning-agents"
  | "06-multimodal"
  | "07-generative-theory"
  | "08-rl"
  | "09-training-infra"
  | "10-cutting-edge"
  | "11-niche-pivotal";

export type Part = {
  slug: PartSlug;
  index: number;
  title: string;
  short: string;
  blurb: string;
  hueVar: string; // CSS variable like --color-part-3
};

export type TopicMeta = {
  /** "03-deep-learning/04-attention" */
  slug: string;
  partSlug: PartSlug;
  partIndex: number;
  topicIndex: number;
  title: string;
  hook: string;
  estMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  prereqs: string[];
  hasHeroViz: boolean;
  vizKey?: VizKey;
  researchers: string[]; // researcher slugs
  flagship?: boolean;
};

export type Researcher = {
  slug: string;
  name: string;
  affiliation: string;
  area: string[];
  short: string;
  bio: string;
  links: { label: string; href: string }[];
  keyPapers: { title: string; year: number; url: string }[];
  story?: {
    headline: string;
    paragraphs: string[];
    pullQuote?: { text: string; source: string };
  };
};

export type PaperStory = {
  slug: string;
  title: string;
  authors: string;
  year: number;
  paperUrl: string;
  topicSlugs?: string[];
  researcherSlugs?: string[];
  headline: string;
  era: string;
  significance: string;
  story: string[];
  pullQuote?: { text: string; source: string };
  legacy: string;
};

export type Paper = {
  title: string;
  authors: string;
  year: number;
  url: string;
  venue?: string;
};

export type ExternalResource = {
  kind: "course" | "blog" | "paper" | "video" | "book" | "model" | "dataset" | "library" | "doc";
  title: string;
  source?: string;
  url: string;
  notes?: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export type TopicFrontmatter = {
  slug: string;
  part: string;
  partTitle: string;
  partIndex: number;
  topicIndex: number;
  title: string;
  hook: string;
  estMinutes: number;
  difficulty: number;
  prereqs: string[];
  hasHeroViz: boolean;
  vizKey?: string;
  researchers?: string[];
  papers?: Paper[];
  hfResources?: ExternalResource[];
  freeResources?: ExternalResource[];
  quiz?: QuizQuestion[];
};

export type VizKey =
  | "gradient-descent"
  | "nn-playground"
  | "attention-heatmap"
  | "diffusion-denoise"
  | "embedding-explorer-3d"
  | "tokenizer"
  | "backprop-stepper"
  | "transformer-3d"
  | "pca-projector"
  | "kernel-trick"
  | "moe-router"
  | "rl-gridworld";
