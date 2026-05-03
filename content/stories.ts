import type { PaperStory } from "@/lib/types";

/** Origin stories for landmark papers — the human narrative behind each. */
export const STORIES: PaperStory[] = [
  {
    slug: "mcculloch-pitts-1943",
    title: "A Logical Calculus of the Ideas Immanent in Nervous Activity",
    authors: "Warren McCulloch & Walter Pitts",
    year: 1943,
    paperUrl: "https://link.springer.com/article/10.1007/BF02478259",
    topicSlugs: [],
    researcherSlugs: [],
    headline: "When biology met formal logic — and gave us the first artificial neuron.",
    era: "Cybernetics (1940s)",
    significance:
      "The first formal model of a neuron. Decades before deep learning, McCulloch and Pitts showed that networks of simple binary units could implement any logical function — and that thought might be a kind of computation.",
    story: [
      "Walter Pitts was a homeless teenager teaching himself logic at the University of Chicago when he met Warren McCulloch, a neurophysiologist twice his age. The unlikely pair shared an obsession: could the firing of biological neurons be described as logical operations?",
      "By 1943, with America at war and computing barely in its infancy, they published the answer. A neuron, they argued, is essentially a threshold gate. Wire them together and you can compute any function expressible in propositional logic. Their abstraction stripped away ion channels, neurotransmitters, and dendritic geometry — leaving only what mattered for computation.",
      "The paper read like mathematical philosophy more than biology, but it was electric. John von Neumann cited it in his foundational notes on the EDVAC, the first stored-program computer. Norbert Wiener built it into cybernetics. A young Marvin Minsky read it and decided to spend his life on AI.",
      "The model's flaws were enormous — no learning, binary signals only, no recurrence to speak of — but the conceptual leap was permanent. After 1943, asking whether brains compute was not a category error. It was an empirical question.",
    ],
    pullQuote: {
      text: "The 'all-or-none' law of nervous activity is sufficient to insure that the activity of any neuron may be represented as a proposition.",
      source: "McCulloch & Pitts, 1943",
    },
    legacy:
      "Every artificial neural network — from perceptrons to GPT — descends from this paper's insight that networks of simple units can compute. The specific binary, learning-free formulation was abandoned, but the substrate remains.",
  },
  {
    slug: "rosenblatt-perceptron-1958",
    title: "The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain",
    authors: "Frank Rosenblatt",
    year: 1958,
    paperUrl: "https://psycnet.apa.org/doi/10.1037/h0042519",
    topicSlugs: [],
    researcherSlugs: [],
    headline: "Hype, headlines, and the first machine that learned.",
    era: "Symbolic AI / first connectionists",
    significance:
      "Rosenblatt's Perceptron was the first algorithm to *learn* — adjusting weights from labelled examples until it could classify them. It birthed neural-network research and, indirectly, the first AI winter.",
    story: [
      "In 1957, at the Cornell Aeronautical Laboratory, Frank Rosenblatt built the Mark I Perceptron — a room-sized machine of 400 photocells, motors, and dials, designed to recognize simple shapes. The next year, in his paper, he formalised the algorithm: a single-layer network that adjusts weights via a simple error-correction rule until it correctly classifies its inputs.",
      "The press response was rapturous. The New York Times reported that the perceptron was 'the embryo of an electronic computer that the Navy expects will be able to walk, talk, see, write, reproduce itself and be conscious of its existence.' Rosenblatt was charismatic and enjoyed the spotlight; he made bold predictions that the field would forever struggle to live up to.",
      "Then came the backlash. In 1969, Marvin Minsky and Seymour Papert published *Perceptrons*, a careful mathematical analysis showing that single-layer perceptrons could not even learn the XOR function. They speculated — incorrectly, it would turn out — that multi-layer extensions would inherit the same fundamental limitations.",
      "Funding evaporated. Rosenblatt died in a sailing accident in 1971 at age 43. The community largely abandoned neural networks for the better part of two decades. The 'first AI winter' had begun, and connectionism would not recover until backpropagation revived it in 1986.",
    ],
    pullQuote: {
      text: "The perceptron is not intended as a detailed copy of any actual nervous system. It is rather an extreme simplification of the central nervous system, which permits some original kind of analysis.",
      source: "Rosenblatt, 1958",
    },
    legacy:
      "The perceptron's learning rule is the direct ancestor of stochastic gradient descent. Every modern training loop — backprop, Adam, RLHF — is its descendant. And the cycle of overpromise → backlash → winter that Rosenblatt inadvertently kicked off has repeated three times since.",
  },
  {
    slug: "rumelhart-hinton-williams-1986",
    title: "Learning Representations by Back-Propagating Errors",
    authors: "David Rumelhart, Geoffrey Hinton, Ronald Williams",
    year: 1986,
    paperUrl: "https://www.nature.com/articles/323533a0",
    topicSlugs: ["03-deep-learning/01-mlp-backprop"],
    researcherSlugs: ["hinton"],
    headline: "Backprop wasn't new. The story is who took it seriously, and when.",
    era: "Connectionist revival",
    significance:
      "The paper that broke the post-Minsky drought. By showing that multi-layer networks could learn internal representations via gradient descent, Rumelhart, Hinton, and Williams reignited connectionism and laid the algorithmic foundation for everything that followed.",
    story: [
      "The chain rule wasn't new in 1986. Paul Werbos had described essentially the same algorithm in his 1974 PhD thesis at Harvard. Seppo Linnainmaa had given the general form in 1970. Yann LeCun derived it independently in his thesis in the early 80s. But academic neural networks were a backwater after Minsky-Papert, and the work didn't connect.",
      "Geoffrey Hinton had been quietly persisting. He'd been a doctoral student at Edinburgh in the 1970s working on neural nets when his supervisor told him repeatedly that the approach was finished. He kept going. By 1986 he'd partnered with David Rumelhart at UC San Diego and Ronald Williams at Northeastern, and they published in *Nature* — not just an algorithm but a demonstration that hidden layers could learn meaningful internal features (face vs not-face, family-tree relations).",
      "The paper's clarity, the prestigious venue, and a gathering wave of empirical interest in neural networks did what Werbos's thesis couldn't: it made the field listen. Within a year, dozens of labs were running multi-layer perceptrons. Within five, networks were doing speech and digit recognition.",
      "But the second AI winter was already gathering. In the 1990s, support vector machines and statistical methods would dominate and connectionism would shrink again — though never to its 1970s nadir. Hinton spent that decade in Canada, where the government quietly funded the unfashionable work. He would not be vindicated until 2012, when his student Alex Krizhevsky used a deep neural network to demolish the ImageNet leaderboard.",
    ],
    pullQuote: {
      text: "We describe a new learning procedure, back-propagation, for networks of neurone-like units. The procedure repeatedly adjusts the weights of the connections in the network so as to minimize a measure of the difference between the actual output vector of the net and the desired output vector.",
      source: "Rumelhart, Hinton & Williams, 1986",
    },
    legacy:
      "Every model in this curriculum is trained by some descendant of backprop. The 1986 paper is the algorithmic root of the deep-learning era — and a case study in why a great paper isn't just a great algorithm; it's the right algorithm in the right venue at the right cultural moment.",
  },
  {
    slug: "lecun-lenet-1998",
    title: "Gradient-Based Learning Applied to Document Recognition",
    authors: "Yann LeCun, Léon Bottou, Yoshua Bengio, Patrick Haffner",
    year: 1998,
    paperUrl: "http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf",
    topicSlugs: ["03-deep-learning/02-cnn"],
    researcherSlugs: ["lecun", "bengio"],
    headline: "A working CNN, fourteen years before anyone noticed.",
    era: "Connectionist revival",
    significance:
      "LeNet-5 was a real, deployed convolutional network that did real work — reading handwritten digits on US bank cheques. It contained nearly every element of modern CNNs: convolution, pooling, end-to-end training. The world ignored it for over a decade.",
    story: [
      "By 1998 Yann LeCun and his collaborators at AT&T Bell Labs had been refining convolutional neural networks for nearly a decade. LeNet-1 had appeared in 1989. LeNet-5 was the polished version: a multi-layer CNN with convolutions, subsampling, and full connections, trained end-to-end with backprop on the MNIST dataset of handwritten digits.",
      "The system worked. By the late 1990s LeNet-derived models were reading roughly 10% of all US bank cheques. The paper itself was a 46-page deep dive into the architecture, the training, and the entire document-processing pipeline.",
      "And yet, in the broader academic community, neural networks were *out*. SVMs were the elegant, theoretically-grounded successors. Random forests were practical and robust. CNNs felt like an ad-hoc trick that happened to work for one narrow problem. Reviewers routinely told LeCun that neural networks were unscientific.",
      "LeCun has talked publicly about the lonely years. The CNN gospel had to wait until 2012, when AlexNet — also a CNN, also trained with SGD and backprop, just deeper and on GPUs and on ImageNet — would shatter the ceiling and force the field to reconsider what LeCun had been saying all along.",
    ],
    legacy:
      "Every modern computer-vision system descends architecturally from LeNet. The 14-year gap between LeNet-5 and AlexNet is one of the great cautionary tales about how long a correct idea can sit unrecognized in a field.",
  },
  {
    slug: "lstm-1997",
    title: "Long Short-Term Memory",
    authors: "Sepp Hochreiter & Jürgen Schmidhuber",
    year: 1997,
    paperUrl: "https://www.bioinf.jku.at/publications/older/2604.pdf",
    topicSlugs: ["03-deep-learning/03-rnn-lstm"],
    researcherSlugs: ["hochreiter"],
    headline: "A graduate thesis in 1991 named the problem. The 1997 paper solved it.",
    era: "Connectionist revival",
    significance:
      "LSTM gave neural networks a working memory. Until transformers replaced them in 2017, LSTMs were the workhorse of every sequential learning system: speech, translation, captioning, time series.",
    story: [
      "Sepp Hochreiter's 1991 master's thesis at TU Munich identified the problem precisely: gradients in recurrent networks vanish or explode as they propagate back through time, making it impossible to learn long-range dependencies. Vanilla RNNs could remember a few steps. They could not remember twenty.",
      "The thesis was in German. It went largely unread by the English-speaking ML community.",
      "Six years later Hochreiter, now collaborating with his advisor Jürgen Schmidhuber, published the answer: a memory cell with a self-recurrent connection of weight 1 (so gradients flow unchanged), gated by learnable input, output, and forget gates. The architecture was complex by 1997 standards — a single LSTM cell has many more parameters than a vanilla recurrent unit — and trained slowly.",
      "Adoption was slow for years. Then, in the 2010s, with more compute and better software, LSTMs became indispensable. Google Translate used them. Apple's Siri used them. Image captioning, video understanding, sequence-to-sequence translation — all LSTM-based until the Transformer arrived in 2017.",
      "Schmidhuber has been famously vocal that the deep-learning community under-credits his lab's contributions. Whatever the politics, the technical legacy is unambiguous: gating mechanisms first introduced for LSTMs (especially the forget gate, added in 1999 by Gers et al.) reappear in GRUs, in Mamba's selective SSM, and conceptually in attention's softmax.",
    ],
    legacy:
      "LSTMs ruled sequence modelling for fifteen years. Their core idea — gated, additive memory updates that preserve gradient — is still alive in modern state-space models like Mamba.",
  },
  {
    slug: "alexnet-2012",
    title: "ImageNet Classification with Deep Convolutional Neural Networks",
    authors: "Alex Krizhevsky, Ilya Sutskever, Geoffrey Hinton",
    year: 2012,
    paperUrl: "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks",
    topicSlugs: ["03-deep-learning/02-cnn"],
    researcherSlugs: ["hinton", "sutskever"],
    headline: "The benchmark result that ended the second AI winter.",
    era: "Deep learning revolution",
    significance:
      "AlexNet won the 2012 ImageNet challenge by a margin so large it embarrassed every competing method. Within months, the entire computer-vision field pivoted to deep learning.",
    story: [
      "Fei-Fei Li had been building ImageNet since 2007 — a dataset of 1.2 million labelled images across 1000 categories — to give the field a benchmark serious enough to differentiate methods. By 2010 the annual ImageNet Large Scale Visual Recognition Challenge had become the field's premier contest, and traditional methods (SIFT features, fisher vectors, SVMs) were creeping forward by fractions of a percent.",
      "Alex Krizhevsky, Geoffrey Hinton's PhD student in Toronto, built a deep CNN to attack the problem. Eight layers, 60 million parameters, ReLU activations (a trick to make training deeper networks tractable), dropout (to combat overfitting), and crucially: trained on two NVIDIA GTX 580 GPUs in his bedroom for a week.",
      "The result was a top-5 error rate of 15.3%, against the second-place finish of 26.2%. It was not an incremental improvement; it was a complete rewrite of what was possible. The room at NIPS 2012 where Krizhevsky presented was reportedly stunned.",
      "Within twelve months every major computer-vision lab had pivoted. Within twenty-four, Hinton, Sutskever, and Krizhevsky's startup DNNresearch had been acquired by Google. The deep-learning era had officially begun, and the field's compute budgets, hiring patterns, and publication norms would never look the same.",
    ],
    pullQuote: {
      text: "Our results show that a large, deep convolutional neural network is capable of achieving record-breaking results on a highly challenging dataset using purely supervised learning.",
      source: "Krizhevsky, Sutskever & Hinton, 2012",
    },
    legacy:
      "AlexNet is the empirical event that made deep learning mainstream. Every research direction in this curriculum either descends from it (CNNs, ResNet, Vision Transformers) or was unblocked by the resources it attracted to the field (everything else).",
  },
  {
    slug: "gan-2014",
    title: "Generative Adversarial Nets",
    authors: "Ian Goodfellow et al.",
    year: 2014,
    paperUrl: "https://arxiv.org/abs/1406.2661",
    topicSlugs: ["07-generative-theory/02-gan"],
    researcherSlugs: ["goodfellow"],
    headline: "An idea conceived in a bar, written that night, working the next morning.",
    era: "Deep learning revolution",
    significance:
      "GANs reframed generative modelling as a two-player game between a forger and a critic. The result was sharper, more photo-realistic samples than any prior method, and a decade of follow-up work that shaped image generation up to diffusion's takeover.",
    story: [
      "The story Ian Goodfellow tells is now legendary. He was at a Montreal bar in 2014 with Yoshua Bengio's group, debating how to make generative models produce sharper outputs. Existing approaches required brittle approximations to probability distributions or generated blurry, low-resolution samples.",
      "The idea hit him at the bar: train two networks simultaneously — a generator that produces fake samples, and a discriminator that tries to tell fakes from real. The generator's loss is the discriminator's success at catching it. Adversarial pressure should drive both networks to improve until the generator's output is indistinguishable from real data.",
      "Goodfellow went home that night and coded it up. The first version worked. By morning he had MNIST digits being generated by a network trained against a classifier. He showed his colleagues, wrote the paper, and submitted to NeurIPS 2014.",
      "What followed was a Cambrian explosion: DCGAN (2015), Progressive Growing (2017), StyleGAN (2018-19), BigGAN, Pix2Pix, CycleGAN. By 2018, GANs were generating photorealistic faces. By 2020, they were generating cats indistinguishable from real ones. The field's image-generation gold standard for ~6 years.",
      "Then, beginning in 2020 with DDPM and accelerating with Stable Diffusion in 2022, denoising diffusion models surpassed GANs on quality, controllability, and training stability. GANs largely retreated to specialized roles. But their conceptual legacy — adversarial training as a regularizer, discriminators as learned losses — pervades modern ML.",
    ],
    pullQuote: {
      text: "We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models.",
      source: "Goodfellow et al., 2014",
    },
    legacy:
      "GANs democratised photoreal generation. Every TikTok face filter, every deep-fake controversy, every generative-art startup of the 2017-2022 era runs on their lineage. Conceptually they introduced the idea that 'losses can be learned by another network' — an insight now everywhere in ML.",
  },
  {
    slug: "attention-is-all-you-need-2017",
    title: "Attention Is All You Need",
    authors: "Ashish Vaswani et al.",
    year: 2017,
    paperUrl: "https://arxiv.org/abs/1706.03762",
    topicSlugs: ["03-deep-learning/04-attention"],
    researcherSlugs: ["vaswani", "shazeer"],
    headline: "The eight-author paper that ate the field.",
    era: "Foundation models",
    significance:
      "The Transformer replaced recurrence with attention as the primary mechanism for sequence modelling. Within five years it had become the architecture of essentially every frontier AI system.",
    story: [
      "By 2017, Google Brain's machine-translation team — Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan Gomez, Łukasz Kaiser, Illia Polosukhin — had been chasing better translation quality with progressively more elaborate LSTM and convolutional architectures. None of them quite worked.",
      "Uszkoreit had the seed idea: drop recurrence entirely. Use attention as the primary primitive. The team built it, named it the Transformer, and watched it beat state-of-the-art translation while training in a fraction of the time (parallelism freed it from sequence-by-sequence backprop through time).",
      "The paper's title was deliberately provocative. The eight authors are listed with equal contribution. The architecture was so simple — encoder, decoder, multi-head attention, residual connections, layernorm, MLPs — that critics initially didn't believe it would generalise. Within months, it had taken over translation. Within a year, BERT showed it could do almost any NLP task. Within four years, GPT-3 showed it could generate persuasive essays from scratch.",
      "Of the eight authors, almost none remain at Google. They have founded or joined Cohere, Character.AI, Inceptive, Adept, and other AI companies. Shazeer co-founded Character.AI then returned to Google. The paper has accrued over 130,000 citations.",
    ],
    pullQuote: {
      text: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer.",
      source: "Vaswani et al., 2017",
    },
    legacy:
      "Every LLM you have heard of — GPT-4, Claude, Gemini, Llama, Mistral, DeepSeek-R1 — is a Transformer derivative. So is every modern image, video, audio, and code model. No other 2010s architecture comes close in cumulative impact.",
  },
  {
    slug: "bert-2018",
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    authors: "Jacob Devlin et al.",
    year: 2018,
    paperUrl: "https://arxiv.org/abs/1810.04805",
    topicSlugs: ["04-transformers-llms/02-bert"],
    researcherSlugs: ["devlin"],
    headline: "The model that briefly defined what an NLP system was supposed to look like.",
    era: "Foundation models",
    significance:
      "BERT introduced bidirectional pre-training of Transformers via masked language modelling, then fine-tuning on downstream tasks. For four years it was the default approach to almost every NLP problem before decoder-only LLMs took over.",
    story: [
      "Jacob Devlin and his co-authors at Google AI took the Transformer encoder, threw it at a corpus of Wikipedia and BookCorpus, and trained it on two simple unsupervised objectives: masked language modelling (predict the missing word) and next-sentence prediction. The result was a representation that could be fine-tuned for almost any downstream NLP task with a small amount of labelled data.",
      "BERT's release caused the same scramble in NLP that AlexNet caused in vision. State-of-the-art on GLUE jumped overnight. Within months, the entire field's leaderboards were dominated by BERT and its variants: RoBERTa, ALBERT, DistilBERT, ELECTRA, DeBERTa.",
      "For four years, 'pretrain BERT then fine-tune for your task' was the default playbook. Companies built BERT-based search ranking, content moderation, sentiment classification. Google itself rolled BERT into search in 2019. Hugging Face was largely built around the BERT ecosystem.",
      "Then GPT-3 demonstrated that decoder-only generation models could do most of these tasks zero-shot via prompting. The encoder-only BERT family didn't disappear — it remains excellent for embeddings, classification, and retrieval — but it ceded the cultural and research spotlight to the GPT lineage.",
    ],
    legacy:
      "Modern dense retrieval (the heart of every RAG system), nearly all production sentence embeddings, and a generation of NLP engineers' first deep-learning experience all trace to BERT. It also normalised the now-universal pretrain-then-finetune workflow.",
  },
  {
    slug: "gpt-3-2020",
    title: "Language Models are Few-Shot Learners",
    authors: "Tom Brown et al.",
    year: 2020,
    paperUrl: "https://arxiv.org/abs/2005.14165",
    topicSlugs: ["04-transformers-llms/01-gpt"],
    researcherSlugs: ["brown", "radford"],
    headline: "175 billion parameters, and the realisation that prompting was a programming model.",
    era: "Foundation models",
    significance:
      "GPT-3 demonstrated that a sufficiently large language model could perform new tasks from a few examples in its prompt — no fine-tuning required. The implications would not be fully felt until ChatGPT two years later.",
    story: [
      "OpenAI had been scaling the GPT line carefully: GPT-1 in 2018 (117M parameters), GPT-2 in 2019 (1.5B), and now GPT-3 in 2020 — 175 billion parameters trained on hundreds of billions of tokens. The compute was eye-watering: training reportedly cost ~$4M.",
      "The paper's most quietly revolutionary claim wasn't about the size. It was about *in-context learning*: feed GPT-3 a handful of examples of a task in its prompt, and it would extrapolate the pattern to new inputs. No gradient updates. No fine-tuning. Just careful prompt construction.",
      "This was the moment 'prompt engineering' became a phrase. The model could write essays in a style after seeing one example, translate between languages from instructions alone, do simple arithmetic, complete code snippets. It hallucinated. It was wildly inconsistent. But the demonstration that prompting *worked* was profound.",
      "OpenAI did not open-source the model. Access was via API, gated initially to selected researchers, then commercialised. This was a strategic break with the field's norms — OpenAI cited safety reasons, critics cited commercial ones — and it set the template for how every subsequent frontier lab would release its models.",
      "Two and a half years later, ChatGPT — a free chat wrapper around an instruction-tuned GPT-3.5 — would put this capability in front of hundreds of millions of users in two months. The world would change.",
    ],
    pullQuote: {
      text: "GPT-3 is applied without any gradient updates or fine-tuning, with tasks and few-shot demonstrations specified purely via text interaction with the model.",
      source: "Brown et al., 2020",
    },
    legacy:
      "GPT-3 is the parent of every conversational AI you have used. Its in-context learning insight underpins all of prompt engineering, all of RAG, and arguably all the agentic AI built since. It also marked the shift to closed, API-mediated frontier models that defines today's industry structure.",
  },
  {
    slug: "ddpm-2020",
    title: "Denoising Diffusion Probabilistic Models",
    authors: "Jonathan Ho, Ajay Jain, Pieter Abbeel",
    year: 2020,
    paperUrl: "https://arxiv.org/abs/2006.11239",
    topicSlugs: ["06-multimodal/03-diffusion-ddpm-sd"],
    researcherSlugs: ["ho", "abbeel"],
    headline: "The paper that took diffusion models from elegant theory to GAN-killer.",
    era: "Foundation models",
    significance:
      "DDPM crystallised diffusion models into a practical training recipe. Within two years, they had displaced GANs as the dominant approach to image generation and become the engine of the generative-AI explosion.",
    story: [
      "Diffusion models' roots reach back to Sohl-Dickstein et al.'s 2015 paper introducing the framework. But the original formulation was hard to train and gave samples nowhere near GAN quality. The idea sat largely on the shelf for half a decade.",
      "Jonathan Ho — then at UC Berkeley with Pieter Abbeel and collaborator Ajay Jain — figured out the right loss function. Reframe the model as predicting the *noise* added at each timestep (rather than the clean signal), use the simple ε-prediction objective, and a clean U-Net with proper time conditioning trains stably and produces strikingly good samples.",
      "The DDPM paper itself was technically dense and made no grand claims. The follow-up work was what shifted the field. OpenAI's GLIDE in 2021 added classifier-free guidance and text conditioning. Stability AI's Stable Diffusion in 2022 added a latent-space variant trainable on consumer GPUs and released the weights publicly. The image-generation explosion that followed reshaped the visual creative industries.",
      "Ho went on to lead the diffusion work at Google, contributing to Imagen and Veo. The paper now has tens of thousands of citations. Diffusion has expanded into video (Sora, Veo), audio, robotics policies, protein structures, and 3D shapes.",
    ],
    legacy:
      "Every image, video, and many audio generative models in production today are diffusion-based. The 2020 paper is the practical hinge between two eras: GANs before, diffusion after.",
  },
  {
    slug: "clip-2021",
    title: "Learning Transferable Visual Models From Natural Language Supervision",
    authors: "Alec Radford et al.",
    year: 2021,
    paperUrl: "https://arxiv.org/abs/2103.00020",
    topicSlugs: ["06-multimodal/01-clip"],
    researcherSlugs: ["radford"],
    headline: "Why train classifiers when you can train alignment?",
    era: "Foundation models",
    significance:
      "CLIP showed that contrastive image-text alignment on web-scale data produces visual representations that beat supervised models on dozens of benchmarks — without ever training on those benchmarks' labels.",
    story: [
      "Alec Radford's papers have a habit of quietly redefining what's possible. After GPT-1 and GPT-2, his next contribution was to apply the same scaling-and-alignment philosophy to vision-language modelling.",
      "The recipe: scrape ~400 million (image, caption) pairs from the public web. Train two encoders — one for images (a Vision Transformer or ResNet), one for text (a Transformer). Use a contrastive loss that pulls matching pairs together in shared embedding space and pushes mismatched pairs apart.",
      "What fell out was startling. The model could classify ImageNet *zero-shot* — without ever seeing an ImageNet label — by encoding the candidate class names ('a photo of a dog', 'a photo of a cat') and picking the nearest text embedding. It scored ~76% top-1 on ImageNet, competitive with fully-supervised ResNets.",
      "But the bigger story was that it generalised. CLIP could classify wildly out-of-distribution images, from sketches to satellite imagery. It became the universal vision encoder for the next several years: Stable Diffusion uses CLIP for text conditioning, dozens of follow-up VLMs use CLIP-derived encoders, and the entire image-search and content-moderation industry runs on CLIP-style embeddings.",
    ],
    legacy:
      "Almost every modern vision-language system — from Stable Diffusion to LLaVA to Sora — uses CLIP-style alignment somewhere in its stack. The contrastive image-text pre-training paradigm CLIP introduced is the dominant approach to learning multimodal representations.",
  },
  {
    slug: "resnet-2015",
    title: "Deep Residual Learning for Image Recognition",
    authors: "Kaiming He et al.",
    year: 2015,
    paperUrl: "https://arxiv.org/abs/1512.03385",
    topicSlugs: ["03-deep-learning/02-cnn"],
    researcherSlugs: ["he"],
    headline: "Skip connections, and the realisation that depth had been a mirage.",
    era: "Deep learning revolution",
    significance:
      "ResNet showed that very deep networks (152 layers and beyond) could be trained reliably if you let gradients flow through identity-mapped 'skip' connections. It won ImageNet 2015 by a wide margin and unlocked the depth race.",
    story: [
      "After AlexNet in 2012, the natural research direction was deeper. VGG (2014) went to 19 layers. GoogLeNet's Inception (2014) went to 22. But beyond a certain point, deeper networks paradoxically performed *worse* than shallow ones — even though they had strictly more capacity. The error didn't come from overfitting; the networks couldn't even fit the training set.",
      "Kaiming He's team at Microsoft Research diagnosed it: gradient flow degraded through depth. Their fix was almost embarrassingly simple — let each layer compute a *residual* update added to the identity mapping, rather than a fresh transformation. The skip connection guaranteed that gradients could always flow back unchanged.",
      "The result: ResNet-152 trained stably and achieved 3.57% top-5 error on ImageNet, beating human-level performance on the benchmark for the first time. Deeper variants (ResNet-1001 in follow-up work) trained without trouble. The depth ceiling that everyone had assumed was a fundamental limit turned out to be a gradient-flow problem.",
      "Skip connections are now ubiquitous. They appear in every Transformer block, every U-Net, every diffusion model, every modern CNN. Kaiming He won the ImageNet 2015 challenge, his initialisation scheme (He init) remains a default, and the residual idea now feels so natural it's hard to remember the year nobody did it.",
    ],
    pullQuote: {
      text: "We hypothesize that it is easier to optimize the residual mapping than to optimize the original, unreferenced mapping.",
      source: "He et al., 2015",
    },
    legacy:
      "Every deep network you train today contains residual connections. The 2015 paper unlocked the depth race that produced everything from BERT to GPT-4. It also reframed depth from 'risky and hard' to 'free and routine'.",
  },
  {
    slug: "chinchilla-2022",
    title: "Training Compute-Optimal Large Language Models",
    authors: "Jordan Hoffmann et al. (DeepMind)",
    year: 2022,
    paperUrl: "https://arxiv.org/abs/2203.15556",
    topicSlugs: ["04-transformers-llms/03-scaling-laws"],
    researcherSlugs: ["hoffmann"],
    headline: "Two years of overtraining undone in a single graph.",
    era: "Foundation models",
    significance:
      "Chinchilla rederived the scaling laws from scratch and showed that contemporary LLMs (GPT-3, Gopher, MT-NLG) had been *under*-trained on data. The compute-optimal split is roughly 20 tokens per parameter — the field had been spending too many parameters and too little data.",
    story: [
      "Kaplan et al.'s 2020 paper had given the field its first scaling laws: as compute grows, model size and training tokens should grow together. The recipe gave models that grew faster in parameters than in tokens. GPT-3 followed this prescription: 175B parameters trained on ~300B tokens.",
      "DeepMind's Jordan Hoffmann and collaborators rederived the laws with more careful methodology — varying both axes systematically rather than fitting through a few large runs. Their conclusion contradicted Kaplan: for a fixed compute budget, parameters and tokens should grow at roughly the same rate, ~20 tokens per parameter.",
      "To prove the point, they trained Chinchilla — 70B parameters, but on 1.4 trillion tokens — at the same compute as Gopher (280B parameters, ~300B tokens). Chinchilla beat Gopher on essentially every benchmark.",
      "The implications were enormous. Every frontier lab promptly re-tilted toward more data per parameter. Llama (Feb 2023) was trained on ~1.4T tokens at 65B parameters, deliberately overshooting the Chinchilla optimum because inference-time cost is dominated by model size, not training cost. The 'Chinchilla-optimal' became the new default — and the deliberate departure from it (small models trained on far more data than 'optimal' for cheap inference) became a key strategic choice.",
    ],
    legacy:
      "Modern LLM training is governed by Chinchilla scaling. Every Llama, Mistral, DeepSeek, and Qwen release is some position on the compute-vs-inference Pareto frontier the paper opened up.",
  },
  {
    slug: "flashattention-2022",
    title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
    authors: "Tri Dao et al.",
    year: 2022,
    paperUrl: "https://arxiv.org/abs/2205.14135",
    topicSlugs: ["09-training-infra/04-flashattn-vllm"],
    researcherSlugs: ["dao"],
    headline: "Reframe attention as IO-bound, not compute-bound, and 5x falls out.",
    era: "Foundation models",
    significance:
      "FlashAttention reduced attention's memory footprint from O(N²) to O(N) by tiling computation to fit in GPU SRAM, giving 2-4× speedups on contemporary models. It became the default kernel within months and unlocked longer-context training.",
    story: [
      "Tri Dao was a Stanford PhD student in Christopher Ré's group when he asked an unfashionable question: where does attention's slowness actually come from? The conventional view was that it's compute-bound — N² operations grow fast.",
      "His careful profiling revealed something different. Attention spends most of its time moving the N×N attention matrix between high-bandwidth GPU memory (HBM) and on-chip SRAM. The compute itself was fast; the IO was the bottleneck.",
      "FlashAttention's fix was a tiling strategy: compute attention block-by-block, never materialising the full N×N matrix, recomputing on the backward pass when needed. The math was identical (it's exact attention, not an approximation), but the IO pattern fit GPU memory hierarchy.",
      "The performance was dramatic — 2-4× speedup on contemporary models, with bigger gains for longer sequences. PyTorch and CUDA absorbed the kernel within months. FlashAttention-2 in 2023 added further parallelism gains. FlashAttention-3 in 2024 specialised for Hopper GPUs (H100s) and approached the hardware's theoretical maximum.",
      "Dao went on to co-author Mamba in late 2023 — applying the same systems-aware perspective to a fundamentally different architecture — then joined Princeton and Together AI.",
    ],
    legacy:
      "Every modern Transformer training run uses some FlashAttention variant. The paper also seeded the now-flourishing 'systems for ML' subfield: vLLM's PagedAttention, speculative decoding, and KV cache compression all share the IO-awareness mindset.",
  },
  {
    slug: "mamba-2023",
    title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
    authors: "Albert Gu, Tri Dao",
    year: 2023,
    paperUrl: "https://arxiv.org/abs/2312.00752",
    topicSlugs: ["10-cutting-edge/02-mamba-ssm"],
    researcherSlugs: ["gu", "dao"],
    headline: "The first credible non-Transformer competitor in six years.",
    era: "Reasoning & post-LLM frontier",
    significance:
      "Mamba showed that selective state-space models could match Transformer quality on language modelling at substantially better inference cost — particularly for long sequences. It reopened the architecture question that had felt closed since 2017.",
    story: [
      "Albert Gu's research line — HiPPO (2020), S4 (2021), DSS, S5 — had been quietly building toward this for years. Each generation refined the structured-state-space architecture: a continuous-time linear dynamical system, parameterised cleverly so it could be efficiently computed as a long convolution.",
      "S4 had matched Transformers on Long Range Arena tasks but couldn't quite hold up on language. The bottleneck was that its dynamics were input-independent — every input got the same recurrence, which limited expressiveness.",
      "Mamba's key innovation was *selectivity*: let the SSM parameters depend on the input. The model can decide on each step whether this token matters and how strongly to integrate it. Combined with a custom CUDA kernel that exploited the structure for fast training, Mamba became competitive with Transformers on language modelling perplexity at parameter-matched scale, with substantially better long-context extrapolation and far cheaper inference (linear instead of quadratic).",
      "The release reignited a dormant research question: does the architecture matter, or is everything just scaling? Mamba-2 in 2024 unified SSM and attention under a single SSD framework. Hybrid models (Jamba, Zamba) interleave Mamba and attention layers. Whether SSMs displace Transformers, complement them, or remain a niche is one of the most-watched open questions of 2025-2026.",
    ],
    legacy:
      "Mamba is the most credible architectural alternative to attention since 2017. Even if Transformers retain dominance, the conceptual move — input-dependent recurrence — is now part of the toolkit for designing efficient long-context models.",
  },
  {
    slug: "dpo-2023",
    title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
    authors: "Rafael Rafailov et al.",
    year: 2023,
    paperUrl: "https://arxiv.org/abs/2305.18290",
    topicSlugs: ["08-rl/04-rlhf-dpo-grpo"],
    researcherSlugs: ["rafailov"],
    headline: "RLHF without the RL.",
    era: "Reasoning & post-LLM frontier",
    significance:
      "DPO showed that RLHF — the complex, brittle, multi-stage pipeline of reward-model training plus PPO — could be replaced with a single closed-form supervised loss. Almost every alignment-tuned model since uses DPO or one of its descendants.",
    story: [
      "RLHF — Reinforcement Learning from Human Feedback — had been the recipe for turning base models into helpful assistants since OpenAI's 2020 summarisation paper and 2022's InstructGPT. The recipe had three stages: supervised fine-tuning on instructions, train a reward model on human preference pairs, then optimise the language model against the reward model with PPO.",
      "The pipeline was a nightmare to operate. PPO is notoriously unstable. Reward hacking — where the model learns to game the reward without improving real quality — was constant. Reward models drifted from human values during training. The compute and engineering overhead was enormous.",
      "Rafael Rafailov, a Stanford PhD student with Chelsea Finn and Christopher Manning, derived the elegance: the optimal policy under a KL-regularised reward objective has a closed form in terms of the reward and the reference policy. Invert this, and you can express the reward implicitly in terms of the policy and the preference data. The result is a single supervised loss — no separate reward model, no RL.",
      "The paper went viral. Within months, almost every open alignment-tuned model — Mistral-Instruct, Llama-2-Chat alternatives, the Zephyr line — was using DPO. Variants quickly proliferated: KTO, IPO, ORPO, GRPO (DeepSeek's group-relative variant used in R1), DAPO (2025).",
    ],
    pullQuote: {
      text: "We show that the RL-based objective used by existing methods can be optimized exactly with a simple binary cross-entropy loss.",
      source: "Rafailov et al., 2023",
    },
    legacy:
      "DPO and its variants are now the standard recipe for aligning open-source LLMs. The deeper lesson — that supposed-to-be-RL problems often have closed-form supervised solutions when you set them up carefully — is itself a research insight worth remembering.",
  },
  {
    slug: "deepseek-r1-2024",
    title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning",
    authors: "DeepSeek-AI",
    year: 2025,
    paperUrl: "https://arxiv.org/abs/2501.12948",
    topicSlugs: ["05-reasoning-agents/01-o1-o3-r1"],
    researcherSlugs: [],
    headline: "Open-source reasoning that matched OpenAI's o1 — and showed the recipe.",
    era: "Reasoning & post-LLM frontier",
    significance:
      "DeepSeek-R1 reproduced OpenAI o1-level reasoning entirely from open ingredients (DeepSeek-V3 base + GRPO + verifiable rewards) and released the weights. It demystified test-time-compute reasoning and triggered an industry-wide pivot toward open reasoning recipes.",
    story: [
      "OpenAI announced o1 in September 2024 and released it in December. The model was a step-change in mathematical and programming reasoning, but OpenAI shared almost nothing about the training recipe — only that it involved reinforcement learning on chain-of-thought generation, with the model encouraged to 'think' before answering.",
      "Speculation churned for months. Was it MCTS over reasoning traces? Process-reward models? Self-play? The community guessed.",
      "DeepSeek's January 2025 R1 release answered the question. The recipe was startlingly clean: take a strong base model (DeepSeek-V3, an MoE the company had released a month earlier), apply GRPO (a PPO variant using group-normalised advantages instead of a value model), and reward the model purely on whether its final answer is correct on verifiable problems (math, code with unit tests).",
      "The model emerged with rich, well-formed reasoning traces — sometimes thousands of tokens of self-correction — and benchmark performance matching o1 on AIME, MATH, and code generation. DeepSeek released the weights, the recipe, and a distilled smaller variant.",
      "The release shocked the industry. DeepSeek had been a relatively unknown Chinese quant-fund spin-off. Western labs accelerated their own reasoning work; Anthropic released Claude 3.7's extended thinking mode within weeks. The market response was severe — NVIDIA's stock dropped sharply on speculation that DeepSeek's compute efficiency would reduce inference demand. The narrative that frontier capabilities required closed labs and billion-dollar training runs took its biggest hit yet.",
    ],
    legacy:
      "R1 made reasoning models accessible to every open-source developer overnight. It also reset the conversation about Chinese AI capability and about whether frontier work could be done with Chinchilla-optimal-scale models plus the right post-training. The latter half of 2025 saw an explosion of R1-derived and R1-inspired reasoning models.",
  },
  {
    slug: "scaling-monosemanticity-2024",
    title: "Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet",
    authors: "Anthropic Interpretability Team",
    year: 2024,
    paperUrl: "https://transformer-circuits.pub/2024/scaling-monosemanticity/",
    topicSlugs: ["10-cutting-edge/03-mech-interp-saes"],
    researcherSlugs: ["olah", "nanda"],
    headline: "The first time mechanistic interpretability felt practical at frontier scale.",
    era: "Reasoning & post-LLM frontier",
    significance:
      "Anthropic's interpretability team trained sparse autoencoders on Claude 3 Sonnet's residual stream and recovered millions of monosemantic features — many human-interpretable, several controllable. It was the strongest evidence yet that LLMs' internal representations could be decomposed into meaningful units.",
    story: [
      "Mechanistic interpretability — the project of understanding *what* a neural network is computing, in terms a human can follow — had been a niche research programme for years. Chris Olah's circuits work at Distill (2020), the toy-models superposition paper (2022), and a sequence of mid-scale SAE papers had built the conceptual foundation but mostly worked on small models.",
      "The May 2024 paper applied the recipe at production scale: train a sparse autoencoder with millions of features on the residual stream of Claude 3 Sonnet, see what emerges. The results were striking. Features corresponded to concepts both prosaic and surprising: the Golden Gate Bridge, sycophancy, code vulnerabilities, deceptive behaviour, specific languages, specific people, abstract ideas like 'inner conflict' and 'gender bias'.",
      "Crucially, *clamping* features (forcing them on or off during inference) caused predictable, often dramatic behavioural changes. Anthropic published 'Golden Gate Claude', a public demo where they pinned the Golden Gate Bridge feature high — the model would mention the bridge in nearly every reply, no matter the context.",
      "The paper reframed alignment-via-interpretability from speculative research direction to plausible engineering tool. Within months, dozens of labs had spun up SAE training runs. Neuronpedia became the canonical browser for SAE features. Anthropic's interpretability team grew rapidly. The circuit-level dream of understanding what LLMs are doing — feature by feature, head by head, layer by layer — feels closer than at any point in the field's history.",
    ],
    pullQuote: {
      text: "We extract interpretable features from a frontier model... The features represent specific people and places, abstractions, and even safety-relevant concepts.",
      source: "Anthropic, May 2024",
    },
    legacy:
      "If alignment is solvable by inspection rather than by behaviour alone, this paper is a foundational step. SAEs are now central to interpretability research at every frontier lab. The dream of mechanistically certifying frontier models — knowing what they 'know' and what they intend — has its first credible engineering footing.",
  },
  {
    slug: "vae-2014",
    title: "Auto-Encoding Variational Bayes",
    authors: "Diederik P. Kingma & Max Welling",
    year: 2014,
    paperUrl: "https://arxiv.org/abs/1312.6114",
    topicSlugs: ["07-generative-theory/01-vae"],
    researcherSlugs: ["kingma", "welling"],
    headline: "The reparameterisation trick that made variational inference scale.",
    era: "Deep learning revolution",
    significance:
      "VAEs gave deep learning its first principled, scalable generative model with a tractable likelihood bound. The reparameterisation trick they introduced is one of the most reused ideas in modern ML.",
    story: [
      "Variational inference had been the elegant Bayesian way to do approximate posterior inference for decades, but it didn't play nicely with neural networks: the gradient through the sampling step blocked end-to-end training.",
      "Diederik Kingma — then a PhD student with Max Welling at the University of Amsterdam — solved it with a trick that now feels obvious. Instead of sampling from the posterior directly, sample from a fixed standard normal and transform deterministically: z = μ + σ·ε. The randomness now sits in ε, which has no parameters; the gradient flows cleanly through μ and σ.",
      "Combined with a recognition network producing the posterior parameters from the data, the result was an end-to-end differentiable variational autoencoder, trainable with SGD on the evidence lower bound. MNIST and Frey Faces samples were not state-of-the-art quality, but the framework was.",
      "VAE samples were never as sharp as GANs, but VAEs gave you a likelihood, a clean latent space for interpolation and arithmetic, and a robust, low-drama training loop. They have remained relevant ever since — VQ-VAE underpins much of modern image and audio compression; latent diffusion models (Stable Diffusion's secret sauce) use a VAE as their compression front-end. Kingma went on to co-author Adam, normalising flows, and Glow.",
    ],
    legacy:
      "The reparameterisation trick is everywhere — diffusion models, normalising flows, RL with continuous actions, neural-ODE solvers. VAEs remain the canonical example of how to combine probabilistic structure with deep networks.",
  },
];

export const STORY_BY_SLUG: Record<string, PaperStory> = Object.fromEntries(
  STORIES.map((s) => [s.slug, s])
);

export const ERA_ORDER = [
  "Cybernetics (1940s)",
  "Symbolic AI / first connectionists",
  "Connectionist revival",
  "Deep learning revolution",
  "Foundation models",
  "Reasoning & post-LLM frontier",
];
