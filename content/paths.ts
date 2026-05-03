import { TOPIC_BY_SLUG } from "./curriculum";

export type PathStep = {
  /** Must reference an existing topic in `content/curriculum.ts`. */
  topicSlug: string;
  /** 1-2 sentences explaining why this step now. */
  why: string;
  /** Optional override of the topic's estMinutes. */
  estMinutes?: number;
};

export type Difficulty = "introductory" | "intermediate" | "advanced" | "frontier";

export type LearningPath = {
  slug: string;
  title: string;
  audience: string;
  duration: string;
  difficulty: Difficulty;
  /** A representative CSS color (oklch or hex) used as the path's accent. */
  hue: string;
  /** A short single-line description used in the gallery card. */
  blurb: string;
  /** 2-3 paragraphs framing the path. */
  intro: string;
  steps: PathStep[];
  capstone?: string;
};

/**
 * Curated reading orders. Each step references an existing topic slug.
 * If you change a slug in `content/curriculum.ts`, update it here too —
 * `validatePaths()` (called at module load in dev) will throw otherwise.
 */
export const PATHS: LearningPath[] = [
  {
    slug: "phd-onboarding",
    title: "PhD onboarding: foundations to your first paper",
    audience: "Incoming ML/AI PhD students and self-taught engineers aiming for research-grade depth.",
    duration: "8 weeks",
    difficulty: "introductory",
    hue: "oklch(0.7 0.18 145)",
    blurb: "The mathematical and architectural backbone, in the order an advisor would teach it.",
    intro:
      "This is the path to walk if you have a CS or quant background but want a research-grade map of modern ML. Eight weeks, sixteen topics, one through-line: from the linear algebra that lives inside every gradient, through the optimization that trains the network, into the architectures that won the field, and out the other side ready to read — and reproduce — a 2024 paper.\n\nEach step builds on the last with intent. We start in the math part not because it's prerequisite folklore, but because the reparameterization trick, the kernel trick, attention, and Adam are all secretly linear-algebra stories told with different vocabulary. By week four you should be able to derive backprop on a whiteboard; by week eight you should be reading nanoGPT and arguing with Chinchilla.\n\nFinish this and you'll have the vocabulary and the muscle to choose a research direction with eyes open — instead of latching onto the first cool paper your group cites.",
    steps: [
      { topicSlug: "01-math/01-linear-algebra", why: "Everything downstream is matrix multiplications and inner products. Anchor your intuition for spans, ranks, and SVD before anything else." },
      { topicSlug: "01-math/02-probability-information", why: "Cross-entropy, KL, and the ELBO are the language modern training uses to talk about itself. Get fluent here and half the field's notation falls out." },
      { topicSlug: "01-math/03-optimization", why: "SGD is a physics simulation on a non-convex landscape. Know momentum and Adam intimately — they're the actual learning algorithm." },
      { topicSlug: "02-classical-ml/01-regression", why: "Squared error and cross-entropy aren't arbitrary; they're max-likelihood under Gaussian and categorical noise. This frames every loss to come." },
      { topicSlug: "03-deep-learning/01-mlp-backprop", why: "The chain rule, the compute graph, the autograd tape — internalize this and PyTorch becomes transparent. Try it once on paper before you touch a framework." },
      { topicSlug: "03-deep-learning/02-cnn", why: "Spatial weight sharing, receptive fields, and the residual trick. CNNs are the pedagogically clearest deep architecture and ResNet is still the model of \"why depth works\"." },
      { topicSlug: "03-deep-learning/03-rnn-lstm", why: "You need to feel the pain of sequential bottlenecks before attention reads as a release. The LSTM gating story also returns later in SSMs." },
      { topicSlug: "03-deep-learning/04-attention", why: "The single architectural idea that ate sequence modeling. Read \"Attention is All You Need\" with the heatmap viz open in another tab." },
      { topicSlug: "04-transformers-llms/01-gpt", why: "Decoder-only + next-token prediction is now the dominant compute paradigm of the field. Walk the 3D transformer to see how the pieces stack." },
      { topicSlug: "04-transformers-llms/02-bert", why: "The bidirectional cousin — important to read once because half the literature you'll cite was BERT-shaped before the field went generative." },
      { topicSlug: "04-transformers-llms/03-scaling-laws", why: "Kaplan and Chinchilla turned ML into a forecastable engineering science. This is what every frontier lab is actually optimizing." },
      { topicSlug: "04-transformers-llms/04-instruction-tuning", why: "How a base model becomes an assistant. SFT, few-shot, and chain-of-thought are the bridge from research artifact to product." },
      { topicSlug: "09-training-infra/02-lora-qlora", why: "You will fine-tune long before you pretrain. LoRA is the realistic on-ramp to running experiments on a single GPU." },
      { topicSlug: "10-cutting-edge/05-rag-long-context", why: "Most \"LLM application\" research is RAG-shaped. Knowing the failure modes early saves a year of bad benchmarks." },
      { topicSlug: "08-rl/04-rlhf-dpo-grpo", why: "The alignment lever. DPO and GRPO are the operationally important variants right now — read them in dialogue with PPO." },
      { topicSlug: "10-cutting-edge/03-mech-interp-saes", why: "The closing capstone: interpretability gives you a microscope to ask \"what did this thing actually learn?\" Try Neel Nanda's tutorials with this in hand." },
    ],
    capstone:
      "Reproduce nanoGPT on TinyStories, then write a 4-page paper-style report comparing your training curves against the Chinchilla-scaled prediction. Bonus: fine-tune with LoRA and run a small RLHF preference loop using DPO.",
  },

  {
    slug: "classical-to-modern-bridge",
    title: "From classical ML to transformers",
    audience: "Engineers and statisticians fluent in classical ML who need a fast bridge into deep learning and LLMs.",
    duration: "4 weeks",
    difficulty: "intermediate",
    hue: "oklch(0.7 0.16 60)",
    blurb: "If you already know SVMs and gradient boosting, this is the shortest honest route to attention.",
    intro:
      "If you spent a decade fitting random forests, you don't need another \"what is a perceptron\" tutorial — you need the conceptual bridges. SVMs already taught you about margins and kernels; this path uses those as the foothold to climb into NTK, then into deep nets, then into attention.\n\nThe pacing assumes you read math comfortably and can skim Bishop. We move fast through the deep-learning core and spend the saved budget on the bridges classical practitioners often miss: why infinitely-wide networks are kernels (NTK), what double descent says about the bias-variance picture you grew up with, and how attention generalizes the kernel trick.\n\nFour weeks, twelve topics. Aim to finish able to explain — to a Bayesian friend — why a transformer is a sensible inductive prior for language.",
    steps: [
      { topicSlug: "02-classical-ml/01-regression", why: "Re-anchor on the loss-as-likelihood framing. This is the lens through which you'll understand everything that follows." },
      { topicSlug: "02-classical-ml/02-svm", why: "SVMs and the kernel trick are your bridge: the implicit feature map is the same idea that returns as NTK and as attention." },
      { topicSlug: "02-classical-ml/06-gaussian-processes", why: "GPs are the Bayesian cousin of SVMs and the kernel limit of wide networks — they make NTK feel inevitable." },
      { topicSlug: "11-niche-pivotal/01-ntk", why: "The bridge itself. Wide neural nets are kernel machines under SGD — read this and a lot of \"why does deep learning work\" mystique evaporates." },
      { topicSlug: "01-math/03-optimization", why: "Quick refresher on SGD/Adam — classical ML often hides the optimizer; in deep learning it's a first-class part of the model." },
      { topicSlug: "03-deep-learning/01-mlp-backprop", why: "The chain rule made operational. If you've never written backprop by hand, do it once before moving on." },
      { topicSlug: "03-deep-learning/02-cnn", why: "Spatial structure and weight sharing — the classical-ML practitioner's intuition for feature engineering, made differentiable." },
      { topicSlug: "03-deep-learning/03-rnn-lstm", why: "Sequential modeling with vanishing gradients. Important to feel the pain that attention solves." },
      { topicSlug: "03-deep-learning/04-attention", why: "Read it as a soft, learned, content-addressable kernel lookup — that framing connects directly to your kernel intuitions." },
      { topicSlug: "04-transformers-llms/01-gpt", why: "Decoder-only + next-token prediction is the dominant paradigm. Stack the attention idea up and you have GPT." },
      { topicSlug: "04-transformers-llms/03-scaling-laws", why: "Why bigger and more data wins, expressed as an empirical power law — the most predictable phenomenon in modern ML." },
      { topicSlug: "10-cutting-edge/07-double-descent-grokking", why: "The phenomena that broke the classical bias-variance picture. Close the loop on what overparameterization actually does." },
    ],
    capstone:
      "Reimplement a 1-layer attention head from scratch in NumPy and compare it head-to-head with an RBF-kernel SVM on a small sequence-classification task. Write up: where does each shine, and why?",
  },

  {
    slug: "frontier-2025-26",
    title: "Track the frontier (2025–26)",
    audience: "PhD students and applied researchers who already know transformers and want to catch up to the current research front.",
    duration: "Rolling, ~6 weeks",
    difficulty: "frontier",
    hue: "oklch(0.62 0.2 350)",
    blurb: "What's actually happening at the labs right now: reasoning, MoE, SSMs, mech-interp, agents.",
    intro:
      "The field moves on a quarterly cadence and the textbooks won't catch up. This path is what you'd read if a senior researcher cornered you at NeurIPS and asked \"so what did you make of the last twelve months?\" Reasoning models, mixture-of-experts at trillion-parameter scale, the Mamba revival, mechanistic interpretability finding actual circuits, and agents that use computers.\n\nIt assumes a working knowledge of transformers and RL fundamentals. The first half is about training-time and architectural shifts (scaling, MoE, SSMs); the second half is about test-time compute, agency, and the emerging interpretability stack. If you only have time for three of these, do o1/R1, MoE, and mech-interp — those are the live conversations.\n\nTreat this path as a rolling reading list. Re-walk it every quarter and the bibliography will refresh itself.",
    steps: [
      { topicSlug: "04-transformers-llms/03-scaling-laws", why: "The scoreboard everything else is measured against. Re-read with Chinchilla and Llama-3 training compute in mind." },
      { topicSlug: "04-transformers-llms/04-instruction-tuning", why: "The substrate that reasoning and agents are built on. Pay attention to the SFT → RLHF → DPO progression." },
      { topicSlug: "10-cutting-edge/01-moe", why: "Mixtral, DeepSeek-V3, and the GPT-4 leak all confirm: dense scaling is over, expert routing is the next axis." },
      { topicSlug: "10-cutting-edge/02-mamba-ssm", why: "The first credible challenger to attention since 2017. Linear-time inference matters more than people thought." },
      { topicSlug: "11-niche-pivotal/03-hyena", why: "The other subquadratic family — implicit long convolutions. Important context for the SSM debate." },
      { topicSlug: "05-reasoning-agents/01-o1-o3-r1", why: "Test-time compute is the new training-time compute. R1's open release made this the most-discussed paper of the year." },
      { topicSlug: "10-cutting-edge/08-test-time-compute", why: "The general principle behind o1: best-of-N, self-consistency, MCTS-on-LLMs. Read this with R1 fresh." },
      { topicSlug: "08-rl/04-rlhf-dpo-grpo", why: "GRPO is the algorithm that powered R1. DPO is what most labs actually ship. Both deserve careful reading." },
      { topicSlug: "10-cutting-edge/03-mech-interp-saes", why: "Sparse autoencoders found real, named features in production models in 2024. This is the most exciting empirical story in interpretability." },
      { topicSlug: "10-cutting-edge/05-rag-long-context", why: "Long context (1M+) made RAG less necessary in some regimes. Understand both before claiming either won." },
      { topicSlug: "05-reasoning-agents/03-mcp-agent-frameworks", why: "MCP standardized agent tool-use in 2025. If you're building anything agent-shaped, this is the protocol you need to know." },
      { topicSlug: "05-reasoning-agents/05-agentic-coding", why: "Coding agents are the highest-economic-value test bed for everything above. Cursor, Claude Code, and Devin set the bar." },
      { topicSlug: "05-reasoning-agents/06-computer-use-agents", why: "Pixel-grounded vs DOM-grounded agents — the next frontier after coding. Anthropic's Computer Use and OpenAI's Operator are the references." },
      { topicSlug: "11-niche-pivotal/07-world-models", why: "Dreamer, V-JEPA, Genie — the LeCun thesis. Whether or not you buy it, you need to argue with it from primary sources." },
    ],
    capstone:
      "Pick a frontier paper from the last 90 days and write a 6-page critical review: what's new, what's a relabel, what would you change, and what's the cheapest experiment that would falsify the central claim?",
  },

  {
    slug: "generative-deep-dive",
    title: "Generative modeling deep dive",
    audience: "Researchers and engineers building or studying image, video, and 3D generative models.",
    duration: "5 weeks",
    difficulty: "advanced",
    hue: "oklch(0.6 0.22 280)",
    blurb: "VAEs to flow matching to video diffusion — the full likelihood-and-score story.",
    intro:
      "Generative modeling has the most beautiful theory in deep learning and the most chaotic empirical literature. This path walks the theoretical line — likelihood, then variational bounds, then score-matching, then flows — and only then turns to the architectures (DDPM, Stable Diffusion, Sora, Veo) that actually ship pixels.\n\nFive weeks, eight to ten topics. The crucial mental models to build: the ELBO as a coherent objective family, the equivalence between score-matching and denoising, and why flow matching is a strictly better training scheme than DDPM in most regimes.\n\nFinish able to read a 2025 video model paper and identify exactly which generative-modeling family it descends from — and which trade-off it's making.",
    steps: [
      { topicSlug: "01-math/02-probability-information", why: "KL, entropy, and the change-of-variables formula are the bedrock. The ELBO will not click without them." },
      { topicSlug: "07-generative-theory/01-vae", why: "ELBO and the reparameterization trick — the parent of every modern likelihood-based generator." },
      { topicSlug: "07-generative-theory/02-gan", why: "Read for historical literacy and for the implicit-density framing. Mode collapse and StyleGAN are still cited as cautionary tales." },
      { topicSlug: "07-generative-theory/03-normalizing-flows", why: "Exact likelihood through invertible maps — the missing intermediate between VAEs and continuous-time flows." },
      { topicSlug: "07-generative-theory/04-energy-based-models", why: "Score matching in disguise. This is the conceptual bridge that makes diffusion feel inevitable rather than magical." },
      { topicSlug: "06-multimodal/03-diffusion-ddpm-sd", why: "The shipping workhorse. Read Ho et al. and Rombach et al. back-to-back to feel the architecture-meets-theory transition." },
      { topicSlug: "06-multimodal/04-flow-matching", why: "Straighter probability paths, fewer steps. The current state of the art for fast samplers." },
      { topicSlug: "06-multimodal/05-video-sora-veo", why: "Diffusion stretched along the time axis. Read with attention to compute, latent compression, and physics priors." },
      { topicSlug: "06-multimodal/01-clip", why: "The conditioning signal that made text-to-image possible. Worth a careful pass even if you've used it casually." },
      { topicSlug: "11-niche-pivotal/05-neural-odes", why: "Closing the loop: continuous-depth networks, the adjoint method, and the link back to flow matching." },
    ],
    capstone:
      "Implement DDPM and a flow-matching variant on CIFAR-10 from scratch. Plot FID vs sampling steps for both. Write a one-pager on which you'd ship and why.",
  },

  {
    slug: "alignment-and-safety",
    title: "Alignment, safety & interpretability",
    audience: "Researchers and engineers working on alignment, interpretability, evals, or AI safety policy.",
    duration: "5 weeks",
    difficulty: "advanced",
    hue: "oklch(0.65 0.22 320)",
    blurb: "RL fundamentals through RLHF, then DPO/GRPO, then the interpretability stack.",
    intro:
      "Alignment work sits at the intersection of three traditions: RL theory, language-model engineering, and interpretability. This path threads them in the order that lets each one make sense of the next. RL gives you the optimizer; instruction tuning gives you the substrate; RLHF (then DPO and GRPO) gives you the actual alignment lever; mech-interp gives you a microscope to ask whether the lever did what you think it did.\n\nFive weeks. The path leans technical — there is no \"AI safety policy\" topic here because the policy work is downstream of being able to read RLHF and SAE papers without help.\n\nIf you want a single takeaway: alignment is empirical, and the empirical results are evolving fast. Treat each step as a moving target and re-read the primary sources annually.",
    steps: [
      { topicSlug: "08-rl/01-mdps", why: "Bellman equations and the value-iteration view of the world. You cannot read RLHF papers without this vocabulary." },
      { topicSlug: "08-rl/02-q-learning", why: "Off-policy TD learning — important even for LLM RL because GRPO and friends inherit the bias-variance trade-offs." },
      { topicSlug: "08-rl/03-policy-gradient-ppo", why: "PPO is the ancestor of RLHF. Internalize the clipped surrogate objective; it's the engineering trick that makes any of this work." },
      { topicSlug: "04-transformers-llms/04-instruction-tuning", why: "SFT is the substrate alignment is applied to. Many alignment failures are actually SFT data failures in disguise." },
      { topicSlug: "08-rl/04-rlhf-dpo-grpo", why: "The central topic of this path. Read the InstructGPT paper, the DPO paper, and the GRPO/DeepSeek-Math paper in that order." },
      { topicSlug: "10-cutting-edge/06-distillation-merging", why: "Constitutional AI and self-rewarding pipelines depend heavily on synthetic data and distillation. Important context for modern alignment recipes." },
      { topicSlug: "10-cutting-edge/03-mech-interp-saes", why: "The most exciting empirical story in interpretability — sparse autoencoders find real features in real models. Read Anthropic's monosemanticity papers." },
      { topicSlug: "10-cutting-edge/04-in-context-learning", why: "Emergent capability discontinuities are the hard case for evals. Understand the phenomenology before claiming any model is or isn't dangerous." },
      { topicSlug: "05-reasoning-agents/01-o1-o3-r1", why: "Reasoning models change the threat model: the model can plan, backtrack, and route around shallow safety training. Important to grok before red-teaming." },
      { topicSlug: "05-reasoning-agents/06-computer-use-agents", why: "Computer-use agents are where alignment failures become observable in the real world. Read with safety in mind." },
    ],
    capstone:
      "Pick a small open model, fine-tune it with DPO on a preference dataset of your design, then train a tiny SAE on its residual stream and write up which features the alignment intervention most affected.",
  },

  {
    slug: "infra-and-systems",
    title: "Training & inference infrastructure",
    audience: "ML engineers and systems researchers responsible for training large models or serving them efficiently.",
    duration: "4 weeks",
    difficulty: "advanced",
    hue: "oklch(0.6 0.05 250)",
    blurb: "FSDP, ZeRO, LoRA, quantization, FlashAttention, vLLM — the whole stack.",
    intro:
      "If you've ever watched an 8xH100 box sit at 12% utilization during training, this path is for you. Modern ML systems work is a stack: distributed training (sharding the model), parameter-efficient finetuning (sharding the gradient), quantization (sharding the bits), kernel-level attention (sharding the memory hierarchy), and high-throughput serving (sharding the request queue).\n\nFour weeks, eight topics. The order matters: you need to understand FSDP and ZeRO before LoRA makes sense as a memory story, and you need LoRA before quantization (QLoRA) is anything but a curiosity. FlashAttention and vLLM close the loop on the inference side.\n\nFinish ready to read a Megatron, DeepSpeed, or vLLM PR and have an opinion.",
    steps: [
      { topicSlug: "03-deep-learning/01-mlp-backprop", why: "Quick refresher: the activations vs gradients vs optimizer-state memory split is the entire game. ZeRO partitions exactly this." },
      { topicSlug: "03-deep-learning/04-attention", why: "You cannot reason about FlashAttention without re-deriving QKV memory cost. Have the attention math fresh." },
      { topicSlug: "09-training-infra/01-fsdp-zero-tp", why: "The three sharding axes. Read the ZeRO paper, then Megatron-LM's TP paper, then PyTorch FSDP docs in that order." },
      { topicSlug: "09-training-infra/02-lora-qlora", why: "Low-rank adapters changed who could fine-tune. Internalize the rank-r decomposition story; QLoRA depends on it." },
      { topicSlug: "09-training-infra/03-quantization", why: "GPTQ, AWQ, NF4 — different trade-offs in calibration and outlier handling. Important to know which to ship when." },
      { topicSlug: "09-training-infra/04-flashattn-vllm", why: "IO-aware attention plus PagedAttention serving. These two ideas cut the cost of LLM serving by an order of magnitude." },
      { topicSlug: "10-cutting-edge/01-moe", why: "MoE serving is its own systems problem — expert routing, all-to-all, expert parallelism. The hardest thing to serve well right now." },
      { topicSlug: "10-cutting-edge/02-mamba-ssm", why: "Linear-time sequence modeling has very different systems trade-offs than attention. Important context for what comes after Hopper." },
    ],
    capstone:
      "Fine-tune a 7B model with QLoRA on a 24GB consumer GPU, then serve it under vLLM and benchmark throughput vs a naive HuggingFace pipeline. Document every memory and latency number along the way.",
  },

  {
    slug: "applied-llm-engineer",
    title: "The applied LLM engineer",
    audience: "Engineers shipping LLM-powered products who need a systematic, opinionated reading order.",
    duration: "3 weeks",
    difficulty: "intermediate",
    hue: "oklch(0.65 0.18 240)",
    blurb: "Just enough theory plus the production stack: prompting, RAG, agents, tools, evals.",
    intro:
      "If you are shipping with LLMs but want to stop guessing, this is the shortest honest path. Three weeks. We skip the math derivations and the RL theory and concentrate on the conceptual model that helps you debug a production failure: how attention works, what a base model is vs an instruction-tuned one, what RAG actually does to the context window, and how agents compose tools.\n\nThe path is shaped around a single question — \"why does my LLM application fail in this specific way?\" — and answers it from first principles. You'll come out fluent in scaling laws, prompting patterns, RAG, and the modern agent stack (MCP, computer use, coding agents).\n\nNo capstone reproduction. The capstone is your product.",
    steps: [
      { topicSlug: "03-deep-learning/04-attention", why: "Even at the application layer, you need a working mental model of QKV. Half of \"prompt engineering\" is just attention budget management." },
      { topicSlug: "04-transformers-llms/01-gpt", why: "Next-token prediction as a substrate. Internalize this and stop being surprised by hallucinations." },
      { topicSlug: "04-transformers-llms/04-instruction-tuning", why: "Why your model behaves the way it does — and how SFT and RLHF shape its persona." },
      { topicSlug: "04-transformers-llms/03-scaling-laws", why: "Quick read for cost intuition: knowing the rough flops/tokens/parameters relationship saves real money in deployment decisions." },
      { topicSlug: "10-cutting-edge/05-rag-long-context", why: "Most production failures live here. Read with eyes open about chunking, embedding choice, and reranking." },
      { topicSlug: "05-reasoning-agents/02-cot-react", why: "CoT and ReAct are still the dominant tool-use patterns. The specific framings here will recur in every agent framework you touch." },
      { topicSlug: "05-reasoning-agents/03-mcp-agent-frameworks", why: "MCP became the lingua franca for agent tools in 2025. If you're building an integration, this is the protocol." },
      { topicSlug: "05-reasoning-agents/04-claude-skills-mcp-deep-dive", why: "Skills + MCP servers are the current sweet spot for production agentic workflows. Read with deployment in mind." },
      { topicSlug: "05-reasoning-agents/05-agentic-coding", why: "Coding agents are the test bed where everything matters: tool use, evals, latency, safety. Lessons here transfer to every other domain." },
      { topicSlug: "05-reasoning-agents/01-o1-o3-r1", why: "Reasoning models change the cost/latency trade-off. Know when to reach for one and when not to." },
      { topicSlug: "09-training-infra/02-lora-qlora", why: "Even if you mostly use APIs, knowing when to fine-tune (and when LoRA suffices) is now table stakes." },
    ],
    capstone:
      "Take an existing prototype and write a one-page failure-mode analysis using the vocabulary from this path. Then ship the fix.",
  },
];

export const PATH_BY_SLUG: Record<string, LearningPath> = Object.fromEntries(
  PATHS.map((p) => [p.slug, p])
);

/** Validate that every step references an existing topic. Throws on first bad slug. */
export function validatePaths(): void {
  for (const path of PATHS) {
    for (const step of path.steps) {
      if (!TOPIC_BY_SLUG[step.topicSlug]) {
        throw new Error(
          `Path "${path.slug}" references missing topic "${step.topicSlug}". ` +
            `Update content/paths.ts or content/curriculum.ts.`
        );
      }
    }
  }
}

// Run once at module load — fails fast in dev/build if a slug rots.
validatePaths();
