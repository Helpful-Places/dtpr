# Changelog

## 0.3.1 — 2026-05-17

**Description trim for Claude Desktop's 1024-char cap.** Six of seven skills had `description:` fields that exceeded the per-skill cap Claude Desktop enforces on upload, blocking installation. The fat was the repeated `For X use sibling-A; for Y use sibling-B; …` block — already documented in each SKILL.md body's "Sibling routing" section. Compressed to a single `See also: …` line; trigger phrases and the "what it does" framing are untouched so dispatch fidelity is preserved.

### Changed

- **`dtpr-translate`** — 1552 → 963 chars. Dropped the implementation-detail sentence on `get_schema.manifest.locales`; collapsed sibling-routing to `See also`.
- **`dtpr-element-design`** — 1355 → 880 chars. Locale-skeleton clause tightened; symbol hand-off kept as a single sentence since it is a genuine workflow dependency, not a router note.
- **`dtpr-datachain-structure`** — 1341 → 1015 chars. Sibling-routing collapsed to `See also`.
- **`dtpr-category-audit`** — 1282 → 921 chars. Sibling-routing collapsed to `See also`.
- **`dtpr-symbol-design`** — 1129 → 854 chars. Sibling-routing collapsed; `dtpr-element-design` hand-off framing retained as a parenthetical because that is the primary inbound path.
- **`dtpr-comprehension-audit`** — 1128 → 896 chars. Sibling-routing collapsed to `See also`.
- **`dtpr-describe-system`** — unchanged (already 998 chars).
- **`.claude-plugin/plugin.json`** — version bumped to 0.3.1.
- **`.mcp.json`** — `User-Agent` header synced to `dtpr-claude-plugin/0.3.1`.

### Added

- **`dtpr-ai/scripts/build-skills.ts`** — build-time packager. Validates each `SKILL.md` frontmatter (description ≤ 1024 chars, name matches dir), zips each skill into a `.skill` file, builds a single combined `dtpr-skills.zip` with all seven, and emits `manifest.json` with file sizes and SHA-256 digests. Wired into `dtpr-ai`'s `prebuild` script so every site deploy ships fresh artifacts. Outputs land at `dtpr-ai/public/skills/<version>/` and are served from the same path on `dtpr.ai`.
- **dtpr.ai install page** — new section under Install for Claude Desktop / Claude.ai users, linking the per-skill `.skill` zips and the combined bundle. The plugin-install path (Claude Code marketplace) remains the recommended one-click flow.

## 0.3.0 — 2026-05-07

**Symbol-design skill split out.** Symbol drafting is no longer mixed into element drafting. The new sibling produces multiple variants per round with a local HTML preview, so a session can compare silhouette strategies before committing to one icon.

### Added

- **`dtpr-symbol-design`** — symbol-tier skill. Proposes three SVG variants per round across distinct silhouette strategies (object/action/frame, stroke/filled/hybrid, single/relation/contained), writes them with a `prefers-color-scheme`-aware HTML preview to `.context/dtpr-symbols/<symbol_id>/` (or OS tmp fallback), grades each variant with a 2–3 sentence legibility note, and on user pick runs a tightening pass before emitting the final cleaned SVG and save path. Inlines variant SVGs into the preview HTML so `currentColor` resolves against the surrounding page rather than against the SVG document's own default.
- **`evals/symbol-design.evals.json`** — five `should_trigger` prompts (new SVG, redesign, three-options, sign-scale iteration, draft-for-rights-element) plus four cross-sibling negatives covering element design, category audit, and comprehension audit.

### Changed

- **`dtpr-element-design`** — Phase 4 reduced from a full SVG drafting protocol (house-style rules, sibling-read, two drawing approaches, composition cues, inline output) to a one-disposition hand-off: reuse an existing symbol, draft a new one via `dtpr-symbol-design`, or iterate via `dtpr-symbol-design`. Description router updated. Sibling routing widened to seven peers. Output template's **Symbol** section is now a hand-off line; the SVG fenced block is gone.
- **`evals/element-design.evals.json`** — the existing `generate-svg-icon` negative is now `cross-sibling:dtpr-symbol-design:generate-svg-icon`. Added a second cross-sibling negative for redesigning the `cloud_storage` icon.
- **`evals/verify.mjs`** — `symbol_id` and `cloud_storage` added to the `knownNonTools` allowlist; both are domain terms that appear in SKILL.md prose and are not MCP tool names.
- **`.claude-plugin/plugin.json`** — version bumped to 0.3.0.
- **`.mcp.json`** — `User-Agent` header synced to `dtpr-claude-plugin/0.3.0`.
- **`README.md`** — skill table expands to seven rows (`dtpr-symbol-design` and the previously undocumented `dtpr-translate` from 0.2.1). Hand-off note clarifies that the symbol skill writes only into the preview root, never into `app/public/dtpr-icons/symbols/`.

## 0.2.1 — 2026-05-06

Plugin metadata bump to bust client caches after the SVG-symbol and translation work shipped at the schema layer in (#281). No skill-side changes.

## 0.2.0 — 2026-04-20

**DTPR authoring studio.** The plugin expands from a two-skill pair into a five-skill authoring studio backed by a shared rubric and a file-based research corpus.

### Added

- **`dtpr-datachain-structure`** — meta-structure schema-tier skill. Critiques or proposes changes to the datachain-type shape itself (categories, requirements, retirement). Emits the `pnpm schema:new` handoff. Inlines a Comprehension check.
- **`dtpr-category-audit`** — category-tier schema skill. Audits one category's element collection for coherence, overlap, and gaps. Inlines a Comprehension check.
- **`dtpr-element-design`** — element-tier schema skill. Drafts, edits, or retires one element as a YAML fragment skeleton; emits a symbol direction as prose (not SVG). Inlines a Comprehension check.
- **`dtpr-comprehension-audit`** — standalone comprehension skill. Grades an element, category, datachain-instance, or pasted content against the public-comprehension rubric.
- **`references/comprehension-rubric.md`** — shared qualitative rubric (audience fit, plain-language, symbol legibility, ambiguity flags, locale coverage, variable-substitution clarity, overlap and distinctness).
- **`references/comprehension-block-template.md`** — exact output shape schema-tier skills inline.
- **`research/` corpus** — file-based author-seeded knowledge base with an append-only `INDEX.md`. Entries carry `source`, `date_accessed`, `authority_tier` (8-value enum), and `applicability_tags` frontmatter. `_`-prefixed entries are git-ignored for privacy.

### Changed

- **`dtpr-describe-system`** — prepended **Phase 0 — Inventory and classify** for artifact-aware multi-host operation. Trial-call-and-degrade probe for `Read`, `WebFetch`, `Task`, `Write`. Size-band classification for PDFs/URLs (verbal / ≤2k / 2–10k / 10–20k / >20k). Budget-overflow structured ask. Inserted an optional corpus-lookup step between Phase 2 and Phase 3. Sibling routing updated to the four-way split.
- **`evals/verify.mjs`** — now validates corpus entry filenames + frontmatter, INDEX.md shape + append-only integrity against the merge base with `origin/main`, and cross-sibling symmetry (`cross-sibling:<skill>:<positive-id>` negatives must match a `should_trigger` on the named sibling). MCP tool-name scan now covers `api/src/mcp/tools/*.ts` so `render_datachain` is recognized.
- **`.claude-plugin/plugin.json`** — version bumped to 0.2.0; description expanded to "authoring studio".
- **`.mcp.json`** — `User-Agent` header synced to `dtpr-claude-plugin/0.2.0`.
- **`README.md`** — five-skill table, per-host capability matrix, Research corpus and References sections, expanded troubleshoot rows.

### Removed

- **`dtpr-schema-brainstorm`** — retired. Its responsibilities split into `dtpr-datachain-structure`, `dtpr-category-audit`, and `dtpr-element-design`. Eval prompts ported: `llm-hallucination`, `third-party-processor`, `retire-element` → `dtpr-element-design`; `generative-output` → `dtpr-datachain-structure`; `accountable-deep-dive` → `dtpr-category-audit`. Straddler prompts also appear as `cross-sibling:*` negatives on the skills they could plausibly fire on.

## 0.1.0 — 2026-04-17

Initial release.

- **`dtpr-describe-system`** — describes an AI system as a schema-validated DTPR datachain.
- **`dtpr-schema-brainstorm`** — brainstorms schema edits (categories, elements, variables, locale coverage).
- Remote MCP at `https://api.dtpr.io/mcp` auto-registered via `.mcp.json`.
- Offline conformance check via `pnpm test:plugin` (Node-builtins-only).
