---
source: https://dropleaf.app/d/AlXez8scbd
date_accessed: 2026-05-06
authority_tier: secondary-commentary
applicability_tags: [category:functional_modes, concept:ai-functional-taxonomy, pattern:verb-framed-capability-axes, other:narain-jashanmal-january-2026]
recheck_after: 2026-11-06
---

# Narain Jashanmal — AI Taxonomy (January 2026, v1.1)

**"AI Taxonomy — An Operational Framework for Precision in AI Discourse"**, by [Narain Jashanmal](https://www.narain.io/), self-published via DropLeaf, January 2026, v1.1. The source DTPR's `functional_modes` category names verbatim — six modes plus the verbs that make each one legible to a non-technical reader.

## Citation

> Jashanmal, N. (2026). *AI Taxonomy — An Operational Framework for Precision in AI Discourse*, v1.1, January 2026. https://dropleaf.app/d/AlXez8scbd

License is not stated on the source page; treat as standard "all rights reserved" and cite-as-quotation. Each derived DTPR element should carry the citation in `Element.citation` so attribution survives downstream consumption.

## The framework in one sentence

> "We use Analytical AI to **decide**, Semantic AI to **understand and remember**, Generative AI to **create**, Agentic AI to **act**, Perceptive AI to **sense**, and Physical AI to **move**."

The verb framing is the load-bearing contribution. Each mode answers "what does the AI *do*?" with a single verb a citizen reader recognizes — anchoring the longer description to a familiar action.

## The six modes (verbatim from source)

| Mode | Verb | What it does | Typical tech | Example use cases |
| --- | --- | --- | --- | --- |
| **Analytical AI** | decides | Predicts, classifies, scores, optimizes | ML models, gradient boosting, neural nets on structured data | Propensity models, LTV prediction, fraud detection, churn scoring |
| **Semantic AI** | understands and remembers | Understands meaning, finds relationships, grounds context | Embeddings, vector DBs, knowledge graphs, GraphRAG | Customer intent understanding, intelligent matching, truth anchoring |
| **Generative AI** | creates | Creates new content: text, images, code, media | LLMs, diffusion models, fine-tuned domain models | Personalized messaging, creative variation, content generation |
| **Agentic AI** | acts | Plans, reasons, uses tools, executes multi-step workflows | LLM + orchestration (MCP, LangGraph), tool interfaces | Campaign optimization, autonomous workflows, digital coworkers |
| **Perceptive AI** | senses | Interprets sensory input: vision, speech, documents | Multimodal LLMs, computer vision, ASR | Document processing, visual inspection, voice interfaces |
| **Physical AI** | moves | Applies intelligence to physical actuators and space | World models, sim-to-real transfer, robotics platforms | Drones, robotics, autonomous infrastructure |

## Boundary cues (derived)

The source does not enumerate boundary cues; these are derived during DTPR audit and recorded here for reuse:

- **Perceptive ↔ Analytical** — input shape: raw signals (pixels, audio, document images) vs structured features. A face-recognition model is perceptive; a credit-scoring model on tabular features is analytical.
- **Semantic ↔ Generative** — whether new content is produced. An embedding lookup is semantic; an LLM that writes a sentence is generative. The same LLM in different modes can be both.
- **Agentic ↔ Physical** — where the action lands. Calling an API or sending an email is agentic; turning a motor or changing a traffic-signal phase is physical.
- **Analytical ↔ Semantic** — input modality. A regression on numeric features is analytical; intent extraction from text is semantic.

## Orthogonal axis (interaction patterns)

The source proposes a separate axis the functional taxonomy does *not* cover — *how* the AI surfaces to users:

- **Invisible AI** — operates in background; user sees outcomes, not the AI (fraud detection, automated routing).
- **Assistive AI** — surfaces recommendations or drafts for human approval (suggested responses, human-in-the-loop agents).
- **Generative UI** — interface itself is constructed by AI based on user intent (dynamic dashboards, intent-driven experiences).
- **Conversational** — turn-based chat or voice (chatbots, voice assistants).

DTPR's `functional_modes` deliberately covers *what* the system does, not *how* it surfaces. The interaction-pattern axis is a candidate for either a separate category or an element-level variable in a future schema beta — flagged here so a later `dtpr-datachain-structure` pass can decide.

## Composition story

The source's strongest argument for verb framing is that real AI products *stack* modes — its example Customer Value Management product composes Analytical → Semantic → Generative → Agentic in one workflow. DTPR already supports this via subchains; the verb framing is what lets a citizen reader follow a multi-mode instance ("this system decides who to message, then creates the message, then acts on the response").

## Why this matters for DTPR

1. **Verb framing satisfies the comprehension rubric's audience-fit and plain-language items.** Citizens reading a notice on a kiosk recognize "decides", "creates", "acts", "senses", "moves". They do not recognize "agentic" without a gloss.
2. **The six-mode partition is the source DTPR adopted by name.** The category description in `api/schemas/ai/2026-04-27-beta/categories/functional_modes.yaml` lists the same six modes verbatim. Authoring elements without crediting the source would be unattributed reuse.
3. **The boundary cues are reusable.** Future `dtpr-element-design` passes for the six elements use these cues in their description text and `dtpr-comprehension-audit` re-runs grade against them.

## Recheck triggers

Recheck before 2026-11-06, or sooner if any of:

- v1.1 is superseded by a later revision on the source URL.
- A peer-reviewed taxonomy publishes overlapping mode definitions (would tier-promote retrieval).
- DTPR adopts a 7th mode or retires one — the source's authority over the partition would weaken.
