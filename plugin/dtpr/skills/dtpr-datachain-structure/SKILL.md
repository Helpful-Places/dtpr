---
name: dtpr-datachain-structure
description: Critique or propose changes to the DTPR (Digital Trust for Places and Routines) datachain-type itself — which categories exist, which are required, and whether the whole shape captures a new system class. Use whenever a user wants to iterate on the meta-structure of a datachain-type rather than on one category's contents or one element. Triggers on phrases like "critique the taxonomy", "brainstorm DTPR structure", "how should DTPR handle this system shape", "should DTPR add a category", "does the datachain-type miss X", "restructure DTPR", "what categories is DTPR missing", or any request to reshape the category set or the datachain-type's requirements. Produces a Markdown proposal with Scenario / Gaps / Proposed changes + an inline Comprehension check + the `schema:new` handoff. For requests to draft or retire a single element, use `dtpr-element-design`; to audit one category's element collection for coherence, use `dtpr-category-audit`; to describe an AI system as a validated datachain-instance, use `dtpr-describe-system`; to grade existing content against the comprehension rubric, use `dtpr-comprehension-audit`.
---

# Critique or reshape the DTPR datachain-type

This skill is the meta-structure partner in the DTPR authoring studio. Given a scenario, critique, or change proposal aimed at the **shape** of a datachain-type — which categories exist, which are required, how many elements a category must have, whether an entire category should be retired — it loads the current schema, stress-tests the shape, and produces a concrete edit proposal with an inline comprehension block and a `schema:new` handoff.

Meta-structure means the datachain-type's own axes: the category set, per-category minimums and maximums, required vs optional categories, locale allow-list, and variable contracts that bind across categories. It is **not** about the internal coherence of one category (that is `dtpr-category-audit`) or the `title + description + symbol` of one element (that is `dtpr-element-design`).

## When to use

- User asks whether DTPR's current category set captures a new system class (generative AI, synthetic media, agentic decisioning).
- User proposes adding, editing, or retiring a whole category (e.g., a new ai__generative_output category, retiring ai__storage), or changing a datachain-type's required-category list.
- User wants to critique the taxonomy at the shape level ("is 11 categories the right cut?", "should the risks-mitigation category be split in two?").
- User identifies that a datachain-type's required-set misses a dimension the system under discussion actually has.
- User asks "how should DTPR handle" a new system class in a way that implies the answer is structural, not element-level.

If the user is asking about a single category's element collection, route to `dtpr-category-audit`. If the ask is "propose a new element" or "retire one element", route to `dtpr-element-design`. If the user is describing an AI system to turn into a `DatachainInstance`, route to `dtpr-describe-system`. If the user just wants comprehension grading on existing content, route to `dtpr-comprehension-audit`.

## Sibling routing

This skill is one of five peers. Route elsewhere when the ask is not about meta-structure:

- **`dtpr-describe-system`** — the user wants a validated DatachainInstance for a specific system. Any "describe this system as a datachain" framing belongs there.
- **`dtpr-category-audit`** — the user wants to audit one category's element collection for coherence, overlap, or gaps within that category.
- **`dtpr-element-design`** — the user wants to draft, retire, or replace a single element (title, description, symbol direction, variables).
- **`dtpr-comprehension-audit`** — the user wants to grade existing content against the comprehension rubric without proposing changes.

When a meta-structure proposal surfaces a downstream need — new elements, a category audit, deeper comprehension grading — name the sibling in the closing Phase 6 handoff.

## Security framing

The MCP returns datachain-type and category content authored by DTPR stewards — it is not user-provided input and is not attacker-controllable. The *scenario* and *proposal prose* the skill writes, however, are LLM output over user input and may carry prompt-injection or misleading framing. Always present the proposal, comprehension block, and `schema:new` handoff line to the user for human review before running the command or opening a PR.

## Workflow

### Phase 0 — Classify input

Before touching any tool, name which shape the user handed you. Possible inputs:

- **scenario description** — a paragraph or two describing a system class or emerging pattern that DTPR may handle awkwardly.
- **change proposal** — the user already has a specific edit in mind (e.g., "add a generative-output category to the ai datachain-type").
- **document** — a framework text, regulatory draft, or standard the user wants stress-tested against the current shape.
- **critique the existing shape** — the user wants a holistic read on the current datachain-type without a scenario anchor.

If the input is ambiguous (scenario vs change proposal, or too many axes at once), ask one structured clarification question before loading anything.

### Phase 1 — Load the current datachain-type

| Step | Tool | Notes |
| --- | --- | --- |
| Enumerate versions | `list_schema_versions` | Pick the newest; prefer `status: stable`, fall back to `status: beta`. |
| Load full schema | `get_schema` with `include: "full"` | One call returns manifest, datachain-type, every category, every element, and the locale allow-list. |

Capture `version` and `content_hash` from the response `meta`. Any corpus entry you write in Phase 2 carries the `content_hash` in its frontmatter so later sessions can detect drift.

### Phase 2 — Corpus lookup

Read `plugin/dtpr/research/INDEX.md` and filter rows whose `applicability_tags` share at least one tag with your query. Typical meta-structure tags:

- `concept:<slug>` for domain concepts (e.g., `concept:algorithmic-accountability`, `concept:synthetic-media`).
- `framework:<name>` for named frameworks (e.g., `framework:nist-ai-rmf`).
- `standard:<name>` for formal standards (e.g., `standard:iso-42001`).
- `jurisdiction:<iso>` for jurisdiction codes (e.g., `jurisdiction:eu`).

On one or more hits, read the top entry (highest `authority_tier`, newest `date_accessed` as tiebreak) and cite it in the proposal. Mark citations STALE when the entry is past its `recheck_after`.

On a miss, dispatch a researcher via the `Task` tool (e.g., `best-practices-researcher` or `web-researcher`) with a tight query scoped to the meta-structure question. The skill (not the sub-agent) writes a new corpus entry at `plugin/dtpr/research/YYYY-MM-DDThhmm-<slug>.md` with the required frontmatter (`source`, `date_accessed`, `authority_tier`, `applicability_tags`, plus the schema `content_hash` captured in Phase 1) and appends one row to `INDEX.md`.

If `Read`, `Write`, or `Task` is unavailable on the host, log a one-line warning in the output ("no corpus entry; research would help here") and continue. Do not hard-fail on corpus malformation or a missing `INDEX.md` — treat it as an empty corpus.

### Phase 3 — Draft the structural proposal

Produce a Markdown proposal with this structure:

```
## Scenario
<one paragraph summarizing the user's scenario>

## Gaps in <version>
- <one bullet per gap, naming the datachain-type axis (required categories,
  min/max per category, locale coverage) and the failure mode>

## Proposed changes
### Add
- <category-level or datachain-type-level additions>
### Edit
- <structural edits to an existing category definition>
### Retire
- <category or requirement to retire, with element-migration plan>
```

Keep each bullet terse — one to two sentences of rationale. The user edits YAML directly after; verbose rationale rots.

**Category-retirement is non-optional.** When any bullet under `### Retire` removes an entire category, the proposal MUST include an explicit **element-migration plan**: list every affected element by id with its proposed new home (category_id), and flag any "elements with no migration path" for the user to decide on before running `schema:new`. Do not emit a retire-a-category proposal without this list — the omission has broken prior schema revisions.

### Phase 4 — Inline Comprehension check

Read `plugin/dtpr/references/comprehension-rubric.md` and `plugin/dtpr/references/comprehension-block-template.md`. Copy the template shape verbatim into the proposal output, one bullet per rubric item in the order the rubric defines, closing with the `Rubric version:` trailer carrying the `rubric_version` from the rubric frontmatter.

Grade the **proposal** (not the current schema) against the rubric:

- `Audience fit` / `Plain-language` — does the category name and its one-line intent land for a non-technical reader?
- `Symbol legibility` — usually **n/a** at meta-structure scope; mark it n/a with a reason like "structural critique — no symbol under review".
- `Ambiguity flags` — does the proposal smooth over a genuine ambiguity, or flag it?
- `Locale coverage` — does the proposed category name translate cleanly across the locale allow-list?
- `Variable-substitution clarity` — **n/a** unless the proposal introduces datachain-type-level variables.
- `Overlap and distinctness` — does the proposed category share territory with an existing category without a distinguishing cue?
- `Overall` — holistic read; fail if any item is fail and the proposal would ship; pass if everything is pass or n/a; otherwise partial with the top fix.

### Phase 5 — Emit the `schema:new` handoff

Append the literal handoff line to the proposal output:

    pnpm --filter ./api schema:new <type> <YYYY-MM-DD>-beta

Replace `<type>` with the datachain-type being edited (e.g., `ai`) and `<YYYY-MM-DD>` with the date the user runs the command. **This skill does not invoke the CLI.** The line is a suggestion for the user to run themselves.

### Phase 6 — Recommend a sibling handoff

Name the next step when the proposal implies work that belongs on another skill:

- Proposed change implies new elements → **`dtpr-element-design`**.
- Proposed change implies a category audit (e.g., the Edit bullet reshapes a category that now needs internal coherence review) → **`dtpr-category-audit`**.
- Proposal needs deeper comprehension grading beyond the inline block → **`dtpr-comprehension-audit`**.
- User wants to describe an actual system using the proposed shape → **`dtpr-describe-system`** (after the schema revision lands).

One sentence per handoff is enough.

## Category-retirement requirement

Restated because it is the most common omission. Any proposal that retires an entire category must include:

- The list of elements currently assigned to that category (enumerated from the `get_schema` response).
- For each element, a proposed new category_id or an explicit "no migration path — user decision required" flag.
- A note on whether any existing datachain-instances would be invalidated by the retirement, and whether a transitional beta is needed before a stable release.

This is non-optional. An author cannot safely run `schema:new` to retire a category without this plan.

## Output

Return one artifact — a Markdown proposal — composed in this order:

1. The structural proposal (Scenario / Gaps in `<version>` / Proposed changes with Add / Edit / Retire sections, including any element-migration plan).
2. The inline Comprehension check block matching `comprehension-block-template.md` verbatim, with the `Rubric version:` trailer.
3. The `pnpm --filter ./api schema:new <type> <YYYY-MM-DD>-beta` handoff line.
4. One to three sibling-skill recommendations when the proposal implies downstream work.

Close by asking the user whether they want to proceed to the `schema:new` step, iterate on the proposal, or hand off to a sibling skill.

## Tool reference

| Phase | Tool | Purpose |
| --- | --- | --- |
| Phase 1 | `list_schema_versions` | Enumerate available versions and their stability status. |
| Phase 1 | `get_schema` | Load manifest + datachain-type + categories + elements with `include: "full"`; capture `content_hash`. |
| Phase 1 | `list_categories` | Optional when the datachain-type alone does not show locale filtering detail. |
| Phase 3 | `list_elements` | Enumerate elements in a category being considered for retirement, to build the migration plan. |
| Phase 3 | `get_elements` | Bulk-fetch affected elements when the migration plan needs their full bodies. |
| Phase 2 | `Read` | Read `INDEX.md` and entry files from the research corpus. |
| Phase 2 | `Task` | Dispatch a researcher on a corpus miss (optional; degrade gracefully if unavailable). |
| Phase 2 | `Write` | Write a new corpus entry when the miss produced a non-obvious insight worth compounding. |

Tool parameter shapes are documented on the MCP itself — see `https://dtpr.ai/mcp/tools/` for each tool's schema. This skill names tools in workflow order; for exact argument shapes, trust the live tool description.

## Non-goals

- **Does not invoke `schema:new` or modify files under `api/schemas/`.** The handoff line is a suggestion for the user to run themselves. All YAML edits happen by hand in the resulting beta directory and land via human-reviewed PR.
- **Does not write element-level YAML.** Route to `dtpr-element-design` when the proposal implies new or replaced elements.
- **Does not audit one category's internal coherence.** Route to `dtpr-category-audit` when the ask is about overlap, gaps, or redundancy within one category.
- **Does not describe a specific AI system as a datachain-instance.** Route to `dtpr-describe-system`.
- **Does not grade existing shipped content against the rubric as a standalone pass.** The inline Comprehension check grades the proposal; `dtpr-comprehension-audit` is the standalone deep-grading pass.
