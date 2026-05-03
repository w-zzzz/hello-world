import type { Part, PartSlug, TopicMeta } from "@/lib/types";

export const PARTS: Part[] = [
  { slug: "01-math", index: 1, title: "Mathematical foundations", short: "Math", blurb: "Linear algebra, probability, optimization.", hueVar: "--color-part-1" },
  { slug: "02-classical-ml", index: 2, title: "Classical machine learning", short: "Classical ML", blurb: "Regression, SVMs, ensembles, clustering.", hueVar: "--color-part-2" },
  { slug: "03-deep-learning", index: 3, title: "Deep learning core", short: "Deep learning", blurb: "MLPs & backprop, CNNs, RNNs, attention.", hueVar: "--color-part-3" },
  { slug: "04-transformers-llms", index: 4, title: "Transformers & LLMs", short: "Transformers", blurb: "GPT, BERT, scaling laws, instruction tuning.", hueVar: "--color-part-4" },
  { slug: "05-reasoning-agents", index: 5, title: "Reasoning & agents", short: "Reasoning", blurb: "o1/o3/R1, ReAct, MCP, agent frameworks.", hueVar: "--color-part-5" },
  { slug: "06-multimodal", index: 6, title: "Multimodal & generation", short: "Multimodal", blurb: "CLIP, LLaVA, diffusion, flow matching, video.", hueVar: "--color-part-6" },
  { slug: "07-generative-theory", index: 7, title: "Generative modeling theory", short: "Generative", blurb: "VAEs, GANs, normalizing flows.", hueVar: "--color-part-7" },
  { slug: "08-rl", index: 8, title: "Reinforcement learning", short: "RL", blurb: "MDPs, PPO, RLHF, AlphaZero.", hueVar: "--color-part-8" },
  { slug: "09-training-infra", index: 9, title: "Training & inference infrastructure", short: "Infra", blurb: "FSDP, LoRA, quantization, FlashAttention.", hueVar: "--color-part-9" },
  { slug: "10-cutting-edge", index: 10, title: "Cutting edge (2024–2026)", short: "Frontier", blurb: "MoE, Mamba, mech-interp, RAG, grokking.", hueVar: "--color-part-10" },
  { slug: "11-niche-pivotal", index: 11, title: "Niche but pivotal", short: "Niche", blurb: "NTK, Hyena, geometric DL, neural ODEs, JEPA.", hueVar: "--color-part-11" },
];

export const PART_BY_SLUG: Record<PartSlug, Part> = Object.fromEntries(
  PARTS.map((p) => [p.slug, p])
) as Record<PartSlug, Part>;

/** Topic metadata. Source of truth for the map, dashboard, and seed.
 *  MDX frontmatter mirrors a subset of this for the reader. */
export const TOPICS: TopicMeta[] = [
  // PART 1 — math
  { slug: "01-math/01-linear-algebra", partSlug: "01-math", partIndex: 1, topicIndex: 1, title: "Linear algebra for ML", hook: "The vector spaces all of deep learning lives in.", estMinutes: 16, difficulty: 2, prereqs: [], hasHeroViz: false, researchers: ["strang"], flagship: true },
  { slug: "01-math/02-probability-information", partSlug: "01-math", partIndex: 1, topicIndex: 2, title: "Probability & information theory", hook: "Why entropy, KL divergence, and likelihood are everywhere.", estMinutes: 18, difficulty: 3, prereqs: ["01-math/01-linear-algebra"], hasHeroViz: false, researchers: ["mackay"] },
  { slug: "01-math/03-optimization", partSlug: "01-math", partIndex: 1, topicIndex: 3, title: "Optimization: SGD, momentum, Adam", hook: "Walk down a non-convex hill without falling off.", estMinutes: 20, difficulty: 3, prereqs: ["01-math/01-linear-algebra"], hasHeroViz: true, vizKey: "gradient-descent", researchers: ["kingma", "ruder"], flagship: true },

  // PART 2 — classical
  { slug: "02-classical-ml/01-regression", partSlug: "02-classical-ml", partIndex: 2, topicIndex: 1, title: "Regression & loss functions", hook: "From squared error to cross-entropy as max-likelihood.", estMinutes: 14, difficulty: 2, prereqs: ["01-math/02-probability-information"], hasHeroViz: false, researchers: ["lecun"] },
  { slug: "02-classical-ml/02-svm", partSlug: "02-classical-ml", partIndex: 2, topicIndex: 2, title: "Support vector machines", hook: "Maximum margins and the kernel trick.", estMinutes: 16, difficulty: 3, prereqs: ["02-classical-ml/01-regression"], hasHeroViz: false, researchers: ["vapnik", "scholkopf"] },
  { slug: "02-classical-ml/03-trees-boosting", partSlug: "02-classical-ml", partIndex: 2, topicIndex: 3, title: "Trees, forests & gradient boosting", hook: "Why XGBoost still wins on tabular data.", estMinutes: 14, difficulty: 2, prereqs: ["02-classical-ml/01-regression"], hasHeroViz: false, researchers: ["breiman", "freund", "chen"] },
  { slug: "02-classical-ml/04-clustering-pca-umap", partSlug: "02-classical-ml", partIndex: 2, topicIndex: 4, title: "Clustering, PCA, t-SNE & UMAP", hook: "How to see high-dimensional data in two dimensions.", estMinutes: 18, difficulty: 3, prereqs: ["01-math/01-linear-algebra"], hasHeroViz: false, researchers: ["maaten", "mcinnes"] },

  // PART 3 — DL core
  { slug: "03-deep-learning/01-mlp-backprop", partSlug: "03-deep-learning", partIndex: 3, topicIndex: 1, title: "MLPs & backpropagation", hook: "Compute graphs, the chain rule, and how gradients flow.", estMinutes: 22, difficulty: 3, prereqs: ["01-math/03-optimization"], hasHeroViz: true, vizKey: "backprop-stepper", researchers: ["hinton", "lecun", "bengio"], flagship: true },
  { slug: "03-deep-learning/02-cnn", partSlug: "03-deep-learning", partIndex: 3, topicIndex: 2, title: "Convolutional networks", hook: "Spatial structure, weight sharing, ResNet's residuals.", estMinutes: 20, difficulty: 3, prereqs: ["03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["lecun", "he"] },
  { slug: "03-deep-learning/03-rnn-lstm", partSlug: "03-deep-learning", partIndex: 3, topicIndex: 3, title: "RNNs, LSTMs, GRUs", hook: "Recurrence, vanishing gradients, and gates.", estMinutes: 16, difficulty: 3, prereqs: ["03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["hochreiter", "bengio"] },
  { slug: "03-deep-learning/04-attention", partSlug: "03-deep-learning", partIndex: 3, topicIndex: 4, title: "Attention is all you need", hook: "The single idea that ate sequence modeling.", estMinutes: 22, difficulty: 4, prereqs: ["03-deep-learning/03-rnn-lstm"], hasHeroViz: true, vizKey: "attention-heatmap", researchers: ["vaswani", "shazeer"], flagship: true },

  // PART 4 — transformers/llms
  { slug: "04-transformers-llms/01-gpt", partSlug: "04-transformers-llms", partIndex: 4, topicIndex: 1, title: "The GPT family", hook: "Decoder-only Transformers + next-token prediction at scale.", estMinutes: 22, difficulty: 4, prereqs: ["03-deep-learning/04-attention"], hasHeroViz: true, vizKey: "transformer-3d", researchers: ["radford", "brown", "sutskever"], flagship: true },
  { slug: "04-transformers-llms/02-bert", partSlug: "04-transformers-llms", partIndex: 4, topicIndex: 2, title: "BERT & masked language models", hook: "Bidirectional context, MLM, and the encoder era.", estMinutes: 16, difficulty: 3, prereqs: ["03-deep-learning/04-attention"], hasHeroViz: false, researchers: ["devlin"] },
  { slug: "04-transformers-llms/03-scaling-laws", partSlug: "04-transformers-llms", partIndex: 4, topicIndex: 3, title: "Scaling laws & Chinchilla", hook: "Compute-optimal models — data and parameters in lockstep.", estMinutes: 18, difficulty: 4, prereqs: ["04-transformers-llms/01-gpt"], hasHeroViz: false, researchers: ["kaplan", "hoffmann"], flagship: true },
  { slug: "04-transformers-llms/04-instruction-tuning", partSlug: "04-transformers-llms", partIndex: 4, topicIndex: 4, title: "Instruction tuning & prompting", hook: "From base model to assistant: SFT, few-shot, CoT.", estMinutes: 16, difficulty: 3, prereqs: ["04-transformers-llms/01-gpt"], hasHeroViz: false, researchers: ["wei", "weng"] },

  // PART 5 — reasoning
  { slug: "05-reasoning-agents/01-o1-o3-r1", partSlug: "05-reasoning-agents", partIndex: 5, topicIndex: 1, title: "Reasoning models & test-time compute", hook: "o1, o3, DeepSeek-R1: thinking before answering.", estMinutes: 20, difficulty: 4, prereqs: ["04-transformers-llms/04-instruction-tuning"], hasHeroViz: false, researchers: ["sutskever", "karpathy"], flagship: true },
  { slug: "05-reasoning-agents/02-cot-react", partSlug: "05-reasoning-agents", partIndex: 5, topicIndex: 2, title: "Chain-of-thought, ReAct & tool use", hook: "Interleaving reasoning with actions.", estMinutes: 16, difficulty: 3, prereqs: ["04-transformers-llms/04-instruction-tuning"], hasHeroViz: false, researchers: ["wei", "amodei"] },
  { slug: "05-reasoning-agents/03-mcp-agent-frameworks", partSlug: "05-reasoning-agents", partIndex: 5, topicIndex: 3, title: "Agent frameworks & MCP", hook: "LangGraph, CrewAI, and the Model Context Protocol.", estMinutes: 14, difficulty: 3, prereqs: ["05-reasoning-agents/02-cot-react"], hasHeroViz: false, researchers: ["amodei"] },
  { slug: "05-reasoning-agents/04-claude-skills-mcp-deep-dive", partSlug: "05-reasoning-agents", partIndex: 5, topicIndex: 4, title: "Claude Skills, MCP servers & the agentic web", hook: "How MCP changed agent integration in 2025.", estMinutes: 16, difficulty: 3, prereqs: ["05-reasoning-agents/03-mcp-agent-frameworks"], hasHeroViz: false, researchers: ["amodei"] },

  // PART 6 — multimodal
  { slug: "06-multimodal/01-clip", partSlug: "06-multimodal", partIndex: 6, topicIndex: 1, title: "CLIP & contrastive vision-language", hook: "Aligning images and text in one shared space.", estMinutes: 16, difficulty: 3, prereqs: ["03-deep-learning/02-cnn", "03-deep-learning/04-attention"], hasHeroViz: true, vizKey: "embedding-explorer-3d", researchers: ["radford"], flagship: true },
  { slug: "06-multimodal/02-llava", partSlug: "06-multimodal", partIndex: 6, topicIndex: 2, title: "LLaVA & VLMs", hook: "Vision encoders + LLMs = visual instruction following.", estMinutes: 14, difficulty: 3, prereqs: ["06-multimodal/01-clip", "04-transformers-llms/04-instruction-tuning"], hasHeroViz: false, researchers: ["liu-llava"] },
  { slug: "06-multimodal/03-diffusion-ddpm-sd", partSlug: "06-multimodal", partIndex: 6, topicIndex: 3, title: "Diffusion: DDPM & Stable Diffusion", hook: "Generation by iteratively denoising.", estMinutes: 22, difficulty: 4, prereqs: ["07-generative-theory/01-vae"], hasHeroViz: true, vizKey: "diffusion-denoise", researchers: ["ho", "rombach"], flagship: true },
  { slug: "06-multimodal/04-flow-matching", partSlug: "06-multimodal", partIndex: 6, topicIndex: 4, title: "Flow matching & rectified flow", hook: "Straighter trajectories, fewer sampling steps.", estMinutes: 18, difficulty: 4, prereqs: ["06-multimodal/03-diffusion-ddpm-sd"], hasHeroViz: false, researchers: ["liphardt", "liu-rectified", "dao"] },
  { slug: "06-multimodal/05-video-sora-veo", partSlug: "06-multimodal", partIndex: 6, topicIndex: 5, title: "Video generation: Sora, Veo, Gen-3", hook: "Diffusion in space and time.", estMinutes: 14, difficulty: 3, prereqs: ["06-multimodal/03-diffusion-ddpm-sd"], hasHeroViz: false, researchers: [] },

  // PART 7 — generative theory
  { slug: "07-generative-theory/01-vae", partSlug: "07-generative-theory", partIndex: 7, topicIndex: 1, title: "Variational autoencoders", hook: "ELBO, the reparameterization trick, and disentanglement.", estMinutes: 18, difficulty: 4, prereqs: ["01-math/02-probability-information", "03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["kingma"] },
  { slug: "07-generative-theory/02-gan", partSlug: "07-generative-theory", partIndex: 7, topicIndex: 2, title: "Generative adversarial networks", hook: "Generator vs discriminator, mode collapse, StyleGAN.", estMinutes: 14, difficulty: 3, prereqs: ["03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["goodfellow", "karras"] },
  { slug: "07-generative-theory/03-normalizing-flows", partSlug: "07-generative-theory", partIndex: 7, topicIndex: 3, title: "Normalizing flows", hook: "Exact likelihood through invertible transforms.", estMinutes: 14, difficulty: 4, prereqs: ["07-generative-theory/01-vae"], hasHeroViz: false, researchers: ["dinh", "kingma"] },
  { slug: "07-generative-theory/04-energy-based-models", partSlug: "07-generative-theory", partIndex: 7, topicIndex: 4, title: "Energy-based models", hook: "Score matching, contrastive divergence, and LeCun's preferred frame.", estMinutes: 16, difficulty: 4, prereqs: ["07-generative-theory/01-vae", "01-math/02-probability-information"], hasHeroViz: false, researchers: ["lecun", "ho"] },

  // PART 8 — RL
  { slug: "08-rl/01-mdps", partSlug: "08-rl", partIndex: 8, topicIndex: 1, title: "MDPs & value functions", hook: "Bellman equations and the language of decisions.", estMinutes: 14, difficulty: 3, prereqs: ["01-math/02-probability-information"], hasHeroViz: false, researchers: ["sutton", "barto"] },
  { slug: "08-rl/02-q-learning", partSlug: "08-rl", partIndex: 8, topicIndex: 2, title: "Q-learning & TD methods", hook: "Off-policy learning from a single trajectory.", estMinutes: 14, difficulty: 3, prereqs: ["08-rl/01-mdps"], hasHeroViz: false, researchers: ["sutton"] },
  { slug: "08-rl/03-policy-gradient-ppo", partSlug: "08-rl", partIndex: 8, topicIndex: 3, title: "Policy gradients & PPO", hook: "Optimize the policy directly; clip the update.", estMinutes: 18, difficulty: 4, prereqs: ["08-rl/02-q-learning"], hasHeroViz: false, researchers: ["schulman"] },
  { slug: "08-rl/04-rlhf-dpo-grpo", partSlug: "08-rl", partIndex: 8, topicIndex: 4, title: "RLHF, DPO, GRPO", hook: "Aligning LLMs to human preferences.", estMinutes: 18, difficulty: 4, prereqs: ["08-rl/03-policy-gradient-ppo", "04-transformers-llms/04-instruction-tuning"], hasHeroViz: false, researchers: ["rafailov", "stiennon"], flagship: true },
  { slug: "08-rl/05-alphago-zero", partSlug: "08-rl", partIndex: 8, topicIndex: 5, title: "AlphaGo, AlphaZero & self-play", hook: "MCTS + neural networks beat the world's best.", estMinutes: 14, difficulty: 3, prereqs: ["08-rl/02-q-learning"], hasHeroViz: false, researchers: ["silver", "hassabis"] },
  { slug: "08-rl/06-mcts-game-playing", partSlug: "08-rl", partIndex: 8, topicIndex: 6, title: "Monte Carlo Tree Search", hook: "UCT, neural priors, and MCTS reborn inside LLMs.", estMinutes: 16, difficulty: 4, prereqs: ["08-rl/05-alphago-zero"], hasHeroViz: false, researchers: ["silver", "hassabis"] },

  // PART 9 — infra
  { slug: "09-training-infra/01-fsdp-zero-tp", partSlug: "09-training-infra", partIndex: 9, topicIndex: 1, title: "Distributed training: FSDP, ZeRO, TP", hook: "Why a 70B model fits on 8 GPUs.", estMinutes: 18, difficulty: 4, prereqs: ["03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["rajbhandari", "shoeybi", "dean"] },
  { slug: "09-training-infra/02-lora-qlora", partSlug: "09-training-infra", partIndex: 9, topicIndex: 2, title: "LoRA, QLoRA & PEFT", hook: "Fine-tune billions of parameters with millions.", estMinutes: 14, difficulty: 3, prereqs: ["04-transformers-llms/04-instruction-tuning"], hasHeroViz: false, researchers: ["hu", "dettmers"] },
  { slug: "09-training-infra/03-quantization", partSlug: "09-training-infra", partIndex: 9, topicIndex: 3, title: "Quantization (GPTQ, AWQ, NF4)", hook: "Smaller numbers, same model, less memory.", estMinutes: 12, difficulty: 3, prereqs: ["09-training-infra/02-lora-qlora"], hasHeroViz: false, researchers: ["dettmers", "frantar"] },
  { slug: "09-training-infra/04-flashattn-vllm", partSlug: "09-training-infra", partIndex: 9, topicIndex: 4, title: "FlashAttention & vLLM", hook: "IO-aware attention and batched serving.", estMinutes: 16, difficulty: 4, prereqs: ["03-deep-learning/04-attention"], hasHeroViz: false, researchers: ["dao", "kwon"], flagship: true },

  // PART 10 — cutting edge
  { slug: "10-cutting-edge/01-moe", partSlug: "10-cutting-edge", partIndex: 10, topicIndex: 1, title: "Mixture-of-Experts (Mixtral, DeepSeek-V3)", hook: "More parameters, same compute per token.", estMinutes: 16, difficulty: 4, prereqs: ["04-transformers-llms/01-gpt"], hasHeroViz: false, researchers: ["shazeer", "lewis-switch"], flagship: true },
  { slug: "10-cutting-edge/02-mamba-ssm", partSlug: "10-cutting-edge", partIndex: 10, topicIndex: 2, title: "Mamba & state-space models", hook: "Linear-time alternatives to attention.", estMinutes: 18, difficulty: 4, prereqs: ["03-deep-learning/03-rnn-lstm", "03-deep-learning/04-attention"], hasHeroViz: false, researchers: ["gu", "dao"], flagship: true },
  { slug: "10-cutting-edge/03-mech-interp-saes", partSlug: "10-cutting-edge", partIndex: 10, topicIndex: 3, title: "Mechanistic interpretability & SAEs", hook: "Reading the mind of a neural network.", estMinutes: 20, difficulty: 5, prereqs: ["04-transformers-llms/01-gpt"], hasHeroViz: false, researchers: ["olah", "nanda"], flagship: true },
  { slug: "10-cutting-edge/04-in-context-learning", partSlug: "10-cutting-edge", partIndex: 10, topicIndex: 4, title: "In-context learning & emergence", hook: "Why few-shot prompting works without training.", estMinutes: 14, difficulty: 4, prereqs: ["04-transformers-llms/03-scaling-laws"], hasHeroViz: false, researchers: ["wei"] },
  { slug: "10-cutting-edge/05-rag-long-context", partSlug: "10-cutting-edge", partIndex: 10, topicIndex: 5, title: "RAG & long-context", hook: "Grounding generation in retrieved knowledge.", estMinutes: 16, difficulty: 3, prereqs: ["04-transformers-llms/04-instruction-tuning"], hasHeroViz: false, researchers: ["lewis-rag"] },
  { slug: "10-cutting-edge/06-distillation-merging", partSlug: "10-cutting-edge", partIndex: 10, topicIndex: 6, title: "Distillation, merging & synthetic data", hook: "Smaller models, smarter data, fused experts.", estMinutes: 14, difficulty: 3, prereqs: ["04-transformers-llms/04-instruction-tuning"], hasHeroViz: false, researchers: ["hinton"] },
  { slug: "10-cutting-edge/07-double-descent-grokking", partSlug: "10-cutting-edge", partIndex: 10, topicIndex: 7, title: "Double descent & grokking", hook: "Counterintuitive generalization.", estMinutes: 14, difficulty: 4, prereqs: ["03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["belkin"] },
  { slug: "10-cutting-edge/08-test-time-compute", partSlug: "10-cutting-edge", partIndex: 10, topicIndex: 8, title: "Test-time compute scaling", hook: "Best-of-N, self-consistency, tree of thoughts, MCTS-on-LLMs.", estMinutes: 16, difficulty: 4, prereqs: ["05-reasoning-agents/01-o1-o3-r1", "08-rl/06-mcts-game-playing"], hasHeroViz: false, researchers: ["wei", "karpathy"] },

  // PART 11 — niche pivotal
  { slug: "11-niche-pivotal/01-ntk", partSlug: "11-niche-pivotal", partIndex: 11, topicIndex: 1, title: "Neural tangent kernels", hook: "Infinitely wide nets become kernel machines.", estMinutes: 14, difficulty: 5, prereqs: ["02-classical-ml/02-svm", "03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["jacot"] },
  { slug: "11-niche-pivotal/02-test-time-training", partSlug: "11-niche-pivotal", partIndex: 11, topicIndex: 2, title: "Test-time training & adaptation", hook: "Learn at inference under distribution shift.", estMinutes: 12, difficulty: 4, prereqs: ["03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["levine"] },
  { slug: "11-niche-pivotal/03-hyena", partSlug: "11-niche-pivotal", partIndex: 11, topicIndex: 3, title: "Hyena & long convolutions", hook: "Subquadratic alternatives via implicit conv.", estMinutes: 14, difficulty: 4, prereqs: ["10-cutting-edge/02-mamba-ssm"], hasHeroViz: false, researchers: ["poli", "dao"] },
  { slug: "11-niche-pivotal/04-geometric-dl", partSlug: "11-niche-pivotal", partIndex: 11, topicIndex: 4, title: "Geometric deep learning", hook: "Equivariance, GNNs, the right symmetries.", estMinutes: 16, difficulty: 4, prereqs: ["03-deep-learning/02-cnn"], hasHeroViz: false, researchers: ["bronstein", "welling"] },
  { slug: "11-niche-pivotal/05-neural-odes", partSlug: "11-niche-pivotal", partIndex: 11, topicIndex: 5, title: "Neural ODEs & continuous depth", hook: "Layers as time, training via the adjoint.", estMinutes: 14, difficulty: 5, prereqs: ["03-deep-learning/01-mlp-backprop"], hasHeroViz: false, researchers: ["chen-node"] },
  { slug: "11-niche-pivotal/06-jepa", partSlug: "11-niche-pivotal", partIndex: 11, topicIndex: 6, title: "JEPA & non-contrastive SSL", hook: "Predict representations, not pixels.", estMinutes: 14, difficulty: 4, prereqs: ["06-multimodal/01-clip"], hasHeroViz: false, researchers: ["lecun", "assran"] },
  { slug: "11-niche-pivotal/07-world-models", partSlug: "11-niche-pivotal", partIndex: 11, topicIndex: 7, title: "World models: Dreamer, V-JEPA, Genie", hook: "Latent prediction in service of planning.", estMinutes: 16, difficulty: 4, prereqs: ["11-niche-pivotal/06-jepa", "08-rl/01-mdps"], hasHeroViz: false, researchers: ["lecun", "assran", "hassabis"] },
];

export const TOPIC_BY_SLUG: Record<string, TopicMeta> = Object.fromEntries(
  TOPICS.map((t) => [t.slug, t])
);

export function topicsInPart(partSlug: PartSlug): TopicMeta[] {
  return TOPICS.filter((t) => t.partSlug === partSlug).sort((a, b) => a.topicIndex - b.topicIndex);
}

export function nextTopic(slug: string): TopicMeta | null {
  const i = TOPICS.findIndex((t) => t.slug === slug);
  return i >= 0 && i < TOPICS.length - 1 ? TOPICS[i + 1] : null;
}

export function prevTopic(slug: string): TopicMeta | null {
  const i = TOPICS.findIndex((t) => t.slug === slug);
  return i > 0 ? TOPICS[i - 1] : null;
}

/** Adjacency list for the prereq DAG. */
export function prereqEdges(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const t of TOPICS) {
    for (const p of t.prereqs) out.push([p, t.slug]);
  }
  return out;
}
