---
rubric_version: 2026-04-20
---

# Comprehension rubric

A qualitative checklist for grading DTPR content (datachain-types, categories, elements, full datachain-instances) against the bar of **"a non-technical commuter understands this in seconds."**

Each item has a short definition and pass/fail/partial signals. There is no scoring math. When an item does not apply to the artifact you are grading (e.g., symbol legibility on a category-level critique), mark it **n/a** and note why in the one-line reason.

This rubric is the shared dependency of `dtpr-comprehension-audit` (standalone use) and the three schema-tier skills (`dtpr-datachain-structure`, `dtpr-category-audit`, `dtpr-element-design`), which inline findings using the block template in `comprehension-block-template.md`.

## Audience fit

Does the content land for the intended audience — a commuter, visitor, or citizen encountering a sign or notice without prior context? A specialist audience (regulator, researcher) does not substitute for the default public audience.

- **pass** — the language, framing, and example would be understood by a non-expert on first read.
- **partial** — the core idea lands but one or two phrases need a gloss.
- **fail** — assumes domain knowledge (legal, technical, operational) the audience does not have.

## Plain-language

Is every noun and verb either everyday English or glossed once? Jargon without gloss is the most common fail mode — "accountable organization", "automated decisioning", "retention" all need plain-language anchors.

- **pass** — no un-glossed jargon; defined terms appear once with a plain-English anchor.
- **partial** — one or two un-glossed terms where the context mostly carries meaning.
- **fail** — three or more un-glossed terms, or a critical term that blocks comprehension.

## Symbol legibility

For element-level or datachain-level content that renders a symbol, does the symbol read at sign scale (roughly the size of a coin viewed from arm's length)? Does it hold its meaning without the caption?

- **pass** — silhouette is clear; meaning carries even without text.
- **partial** — reads with the caption but the symbol alone is ambiguous.
- **fail** — reads only at screen scale, or the symbol misleads when seen alone.
- **n/a** — the artifact under review has no symbol (e.g., a structural critique of a datachain-type).

## Ambiguity flags

Are there places where a careful reader would reasonably diverge in interpretation? Flag them explicitly rather than smoothing them over. A known ambiguity with a flag is better than a hidden ambiguity that ships.

- **pass** — no ambiguities noted, or every ambiguity is explicitly flagged in the content.
- **partial** — one unflagged ambiguity that a careful reader might miss.
- **fail** — multiple unflagged ambiguities; readers would diverge on the intended meaning.

## Locale coverage

Is the content written in a form that can be translated cleanly into the DTPR locale allow-list without losing its core claim? Idioms, culturally-specific framings, and implicit referents translate poorly.

- **pass** — every claim is translatable without idiom loss; placeholder syntax supports all required locales.
- **partial** — one or two phrases would need rework for at least one locale.
- **fail** — the framing is culturally specific in a way that blocks translation, or locale placeholders are incomplete.

## Variable-substitution clarity

When the content uses variable placeholders (retention period, accountable party, jurisdiction), does the rendered result read naturally across the expected range of values? A template that reads fine with "30 days" but breaks with "indefinitely" fails.

- **pass** — renders cleanly across the value range; variable names match user-facing terms.
- **partial** — renders cleanly for the common case but awkwardly at an edge.
- **fail** — substitution breaks grammar, meaning, or alignment with surrounding content.
- **n/a** — the artifact has no variables.

## Overlap and distinctness

When multiple elements or categories share semantic territory, is the boundary between them clear to the reader? Overlap without a distinguishing cue leads to miscategorization downstream.

- **pass** — each item occupies a distinct semantic slot; adjacent items are disambiguated.
- **partial** — one pair of items could be conflated; the distinction is recoverable.
- **fail** — two or more items read as the same thing under most interpretations.
- **n/a** — reviewing a single element with no peer to compare against.

## Overall rubric pass/fail/partial

A holistic read that does not average the items above. If any item is **fail** and the artifact will ship publicly, overall is **fail**. If every item is **pass** or **n/a**, overall is **pass**. Otherwise **partial** with a one-line summary of what to fix before shipping.
