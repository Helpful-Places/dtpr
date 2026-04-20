# DTPR research corpus

A file-based, author-seeded corpus of research notes that the five DTPR authoring-studio skills read from and write to. Entries compound across sessions: the first time a skill needs a framework (ISO 42001, NIST AI RMF), regulatory text (EU AI Act), or prior-art pattern (algorithmic-transparency notices), it dispatches a sub-agent, captures the synthesis here, and every later session cites it instead of re-researching.

The corpus ships with the plugin. It is not pre-seeded — every entry comes from real authoring sessions.

## Contract

**Retrieval.** A skill reads `INDEX.md`, computes query tags from the user's request, filters rows whose `applicability_tags` share at least one tag with the query, and on 1+ hits reads the top row's file. Top is chosen by `authority_tier` (see enum below) with `date_accessed` as tiebreak.

**Write path.** On a corpus miss, if the host has a `Task` tool, the skill dispatches `best-practices-researcher` or `web-researcher` and receives a synthesis. The skill (not the sub-agent) writes the entry file with required frontmatter and appends one row to `INDEX.md`. On hosts without `Task`, the skill flags the gap in its output and continues.

**Concurrency.** Entry filenames carry a minute-precision timestamp suffix so parallel sessions do not silently overwrite each other. `INDEX.md` is append-only — conflicts resolve at PR time, not at write time.

**Freshness.** Each entry may carry `recheck_after`. When retrieval lands on a stale entry, skills mark the citation STALE in their output and, on hosts with `Task`, dispatch an async refresh. The stale citation is still used — stale is better than silent gaps.

**Supersession.** When a refreshed entry supersedes an older one, the new entry sets `supersedes: <old-slug>` in its frontmatter and a one-shot pass updates the old entry's `superseded_by`. Retrieval skips entries that carry `superseded_by`.

**Consumer-side degradation.** When `INDEX.md` is missing or malformed (stale install, Claude.ai read-only, etc.), retrieval treats it as an empty corpus and the skill logs a one-line warning in its output. No skill hard-fails on corpus malformation.

**Privacy.** Filenames prefixed with `_` are git-ignored (see `.gitignore` in this directory). Use that convention for citations you do not want in the public plugin payload — un-scrubbed regulatory drafts, internal memos, confidential vendor responses. Their INDEX rows should either be omitted from commits or scrubbed of the sensitive title/tags.

## Slug convention

    YYYY-MM-DDThhmm-<kebab-slug>.md

The minute suffix eliminates same-day collisions without requiring post-write renames. `verify.mjs` enforces this shape. Example: `2026-04-20T1415-iso-42001-risk-categorization.md`.

## Frontmatter schema

Required fields on every entry:

    ---
    source: <URL or citation string>
    date_accessed: <ISO 8601 date, YYYY-MM-DD>
    authority_tier: <one of the 8 enum values below>
    applicability_tags: [<tag>, <tag>, ...]   # non-empty
    ---

Optional fields:

- `recheck_after: <ISO 8601 date>` — when to treat this entry as stale. Default cadence: **365 days** for `primary-source`, `peer-reviewed`, `standards-body`, `regulatory-text`; **180 days** for the other four tiers.
- `supersedes: <prior-entry-slug>` — set when this entry replaces an earlier one.
- `superseded_by: <newer-entry-slug>` — set by the replacement write; retrieval skips entries that carry this field.
- `content_hash: <hash>` — set when the entry cites schema content from `api/schemas/*`. Carries the schema's `meta.content_hash` at the time of capture; used for drift detection alongside `recheck_after`.

### `authority_tier` enum

Ordered high to low. Retrieval tiebreak picks the highest tier on a multi-hit.

1. `primary-source` — first-party statement from the original author (DTPR stewards, schema committers, original paper author).
2. `peer-reviewed` — published, peer-reviewed scholarly work.
3. `standards-body` — formal standards output (ISO, IEEE, W3C, NIST).
4. `regulatory-text` — statute, regulation, or official guidance issued by a regulator.
5. `industry-report` — published report by a research firm, trade body, or established organization.
6. `engineering-postmortem` — post-incident write-up or lessons-learned from an engineering team.
7. `secondary-commentary` — analysis, journalism, blog post, or explainer.
8. `speculative` — forward-looking opinion, draft thinking, or conjecture.

### `applicability_tags` controlled vocabulary

The seed set. Use `other:<freeform>` for anything that does not fit; promotion to the controlled list happens after a freeform tag appears ≥3 times in real use.

- `category:<id>` — scope is one DTPR category (e.g., `category:ai__risks_mitigation`).
- `element:<id>` — scope is one DTPR element (e.g., `element:accept_deny`).
- `concept:<slug>` — a domain concept (e.g., `concept:algorithmic-accountability`).
- `framework:<name>` — a named framework (e.g., `framework:nist-ai-rmf`).
- `standard:<name>` — a formal standard (e.g., `standard:iso-42001`).
- `jurisdiction:<iso>` — a jurisdiction code (e.g., `jurisdiction:eu`, `jurisdiction:us-ca`).
- `pattern:<slug>` — a design or disclosure pattern (e.g., `pattern:algorithmic-transparency-notice`).
- `other:<freeform>` — escape hatch; freeform after the colon.

## INDEX.md

A flat markdown table. One row per entry. Append-only — `verify.mjs` confirms new rows are appended at EOF and no existing row was rewritten.

Columns: `slug | title | applicability_tags | authority_tier | date_accessed | recheck_after`.

## Validation

`node plugin/dtpr/evals/verify.mjs` checks:

- Every entry filename matches the slug convention.
- Every entry has required frontmatter with valid ISO dates and a closed `authority_tier` enum.
- `applicability_tags` is non-empty.
- `INDEX.md` has the expected header and every data row references an existing entry file.
- When git history is available, `INDEX.md` was modified append-only (no rewrites).
