---
title: DTPR authoring studio — five skills backed by a lazy research corpus
date: 2026-04-20
status: requirements draft → planning handoff
type: brainstorm
---

# DTPR authoring studio

## Problem

Authoring DTPR content at scale is bottlenecked on a small set of expert judgment calls:

- *Structure* — does the current AI datachain (11 categories, ~75 elements) make conceptual sense, and will a commuter understand a sign that renders it?
- *Per-category coherence* — within a category (e.g., Risks & Mitigation), are the elements mutually exhaustive without overlap, and are obvious risk classes missing?
- *Per-element clarity* — does the title+description+symbol triple land for a non-technical reader?
- *Per-instance adaptation* — converting a 40-page AIA (or a product spec, a README, or a mix of both) into a consistent datachain-instance requires dozens of judgment calls across the above dimensions.

The shipped plugin (`plugin/dtpr/`) has `dtpr-describe-system` and `dtpr-schema-brainstorm` — a reasonable day-one pair. But `dtpr-schema-brainstorm` is a generalist that conflates three mindsets (meta, category, element), and `dtpr-describe-system` only takes verbal input, so pilot cities arriving with documents today have no clean on-ramp.

## Solution

Convert `plugin/dtpr/` into a five-skill authoring studio backed by a shared lazy research corpus. Skills map one-to-one to the judgment tiers above; the comprehension check is extracted as a fifth skill invokable standalone.

## Five skills

| Skill | Purpose | Primary input | Primary output | Research fires when |
| --- | --- | --- | --- | --- |
| `dtpr-datachain-structure` | Design or critique the datachain-type itself: which categories, what order, whether the conceptual shape lands for the public. | A scenario or change proposal | Markdown proposal + comprehension assessment | User proposes structure the corpus hasn't seen |
| `dtpr-category-audit` | Review one category's element collection for coherence, overlap, and gaps. | A category id | Markdown audit: coverage map, overlaps, gap list, proposed additions | Gap touches a risk/concept class not yet in the corpus |
| `dtpr-element-design` | Brainstorm the title, description, and symbol for one proposed element. | An element concept + target category | Draft YAML fragment + symbol direction | Element requires domain research the corpus doesn't cover |
| `dtpr-describe-system` *(replaces current; same name retained)* | Take 0+ artifacts (PDFs, URLs, verbal description) and interview the user to assemble a validated datachain-instance. | Source artifacts + user turns | Validated JSON datachain + narrative | Source artifact references a framework or method the corpus doesn't cover |
| `dtpr-comprehension-audit` | Grade existing or proposed schema content against a public-comprehension bar. Invokable standalone or called by the other four in prose handoffs. | A version, a category, an element, or a datachain-instance | Graded findings against the comprehension rubric | Rarely — the rubric is local |

Three tiers:
- **Schema-tier** (datachain-structure, category-audit, element-design) — edit the schema. Emit a `schema:new` command line on handoff.
- **Instance-tier** (describe-system) — produce a datachain-instance. Validate via MCP.
- **Cross-cutting** (comprehension-audit) — grade any artifact against the comprehension bar. Reports graded findings; invocation contract is an open decision below.

Corpus-hit semantics: a corpus hit means "cite the existing entry and continue" — the skill still runs its workflow. Only the *sub-agent dispatch* is conditional on a miss.

## Shared substrate

- `plugin/dtpr/research/` — **lazy corpus** with a defined contract (see "Corpus contract" below). Includes an `INDEX.md` manifest and date-prefixed entry files with frontmatter: `source`, `date_accessed`, `authority_tier`, `applicability_tags`, `recheck_after`, optional `supersedes`.
- `plugin/dtpr/references/comprehension-rubric.md` — owned by `dtpr-comprehension-audit`. Schema-tier skills **must** produce a comprehension block in their output using this rubric (required-inline coupling — see decision 9).
- All MCP/domain reference material is cited via `dtpr.ai/*` (Docus-powered docs-site: tool reference at `dtpr.ai/mcp/tools/*`, envelope at `dtpr.ai/mcp/envelope`, domain terms at `dtpr.ai/concepts/*`). No plugin-local mirrors.
- MCP at `api.dtpr.io/mcp` is unchanged — no new tools.

## Compounding loop

```
user runs skill → skill reads plugin/dtpr/research/INDEX.md →
  hit (applicability-tag overlap with query): read entry, check recheck_after,
       cite if fresh; if stale, flag and/or spawn refresh
  miss: spawn research sub-agent via Task tool, passing INDEX.md as context
       ("does an existing entry cover this? if yes, extend it via supersedes;
        if no, write new") → sub-agent returns synthesis → skill writes
        plugin/dtpr/research/<YYYY-MM-DD>-<slug>.md with frontmatter, appends
        one line to INDEX.md → cite
skill produces output (schema-tier: must include comprehension block) + handoff
  → user edits YAML or datachain → PR
```

Each session pays the research cost only on genuinely novel questions. The corpus grows in the directions the user actually works in.

## Corpus contract

- **Retrieval** — skills read `INDEX.md` first; a hit is applicability-tag overlap with the current query. Falls through to full-file grep when the index is uncertain.
- **Write path** — research sub-agents (`best-practices-researcher`, `web-researcher`) return synthesis text to the caller; the *invoking skill* writes the corpus entry and appends to `INDEX.md`. Sub-agents do not write files directly (they lack `Write` in their tool list).
- **Concurrency** — entry filenames are date-prefixed (`YYYY-MM-DD-<slug>.md`) so parallel sessions don't silently overwrite. `INDEX.md` is append-only; merge conflicts resolve in PR.
- **Freshness + supersession** — `recheck_after` frontmatter flags stale entries; a later entry can explicitly retire an earlier one with `supersedes: <previous-slug>`.
- **Authority tier** — enum locked in planning. Starting set: `primary-source`, `peer-reviewed`, `standards-body`, `regulatory-text`, `industry-report`, `engineering-postmortem`, `secondary-commentary`, `speculative`.

## Architectural decisions (locked in brainstorm)

1. **Studio framing** — five skills + a shared growing corpus, not five independent skills.
2. **Lazy corpus with a locked contract.** Zero pre-seeding (the author will seed when starting to use); retrieval via `INDEX.md`, concurrency via date-prefixed filenames, freshness via `recheck_after`, supersession via frontmatter. See "Corpus contract" above.
3. **Internal-first posture** — skills live in `plugin/dtpr/` on `main` now; public-polish deferred until one real schema revision has run through them.
4. **Comprehension is inline + standalone.** `dtpr-comprehension-audit` is a first-class skill, standalone-invokable against shipped content. Schema-tier skills (datachain-structure, category-audit, element-design) **must** produce a comprehension block in their output using `references/comprehension-rubric.md` — not optional prose handoff.
5. **`dtpr-describe-system` retained by name, expanded in scope** — accepts 0+ artifacts. A **Phase 0** inventories available tools (Read/PDF, WebFetch/URL), classifies artifacts by size+type, and chunks/summarizes artifacts >10 pages before Phase 1. Artifact budget: ~20k tokens of source material per session; beyond that, skill asks user to pre-summarize. Designed to run across Claude Code, Claude Cowork, and Claude.ai — Phase 0 gates on host tool availability.
6. **Only the comprehension rubric is extracted** to `references/`. Other rubrics live in the owning skill until reuse is proven. **No MCP tool cheatsheet** — skills cite `dtpr.ai/mcp/*` Docus pages directly.
7. **Cite `dtpr.ai` docs-site URLs for MCP/domain material.** No plugin-local mirrors.
8. **Accept skill-count collision risk in exchange for conceptual separation.** Five peer skills chosen over a 3-skill merge; reviewers flagged Claude-Code skill-routing may collide among adjacent descriptions. Internal testing will watch for collisions; merge back toward `dtpr-schema-work` (unified schema-tier skill) if collisions prove real in practice. Eval sets expanded to include cross-sibling negatives (see open questions).
9. **Hard-delete `dtpr-schema-brainstorm`** on ship. No stub, no redirect. Replacements (datachain-structure, category-audit, element-design) cover its use cases; its eval prompts port to the appropriate replacement.

## Out of scope

- Modifying `api/src/mcp/` or `api/src/rest/`. Read-side API is complete.
- New MCP tools for schema proposal/write. Skills emit markdown/YAML/JSON; humans edit + PR.
- Shipping a full shared rubric library. Only the comprehension rubric is extracted.
- Pre-seeding the research corpus. Author seeds when first using the skills.
- Plugin-local MCP tool cheatsheet. Skills cite `dtpr.ai/mcp/*` (Docus-powered docs-site).
- Redirect/stub SKILL.md for retired `dtpr-schema-brainstorm`. Hard-delete.

## Open questions for planning

- **Skill names** — table above is a reasonable default; naming polish is a minor planning decision.
- **Research entry specifics** — exact `applicability_tags` vocabulary, `recheck_after` cadence defaults, slug convention details. `authority_tier` enum is proposed above but planning can refine.
- **INDEX.md shape** — minimal columns per entry (slug, title, applicability_tags, authority_tier, date, recheck_after).
- **Eval prompts** — each of the 5 skills needs ≥8 negatives including ≥4 cross-sibling negatives (e.g., an element-design prompt that must NOT trigger category-audit), plus ≥5 positives. Baseline outputs for the expanded `describe-system` refreshed.
- **Comprehension block shape** — markdown section template the schema-tier skills inline in their output (headings, checklist items sourced from rubric).
- **Multi-host packaging** — plugin format ships via `/plugin install dtpr` in Claude Code; parallel distribution to Claude Cowork and Claude.ai follows their respective skill-upload paths. Confirm tool availability matrix per host and document in `plugin/dtpr/README.md`.
- **verify.mjs extensions** — validate corpus entry frontmatter, validate INDEX.md append-only shape.
- **`plugin/dtpr/research/` distribution** — whether corpus entries ship with the plugin (baked into the install) or stay local to the author's clone. Affects whether non-developer users contribute back or just read a snapshot.

## References

- Shipped plugin: `plugin/dtpr/` (commit `43b62b6`).
- Prior plan this evolves from: `docs/plans/2026-04-17-001-feat-dtpr-drafting-skills-plan.md`.
- DTPR schema: `api/schemas/ai/2026-04-16-beta/` — 11 categories, ~75 elements.
- MCP server: `api/src/mcp/tools.ts` — 9 tools.
- Docs-site: `dtpr-ai/content/` — `6.concepts/`, `2.mcp/`, `3.rest/`.
