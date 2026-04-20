# DTPR authoring plugin

Describe AI systems as DTPR datachains, author and iterate on the DTPR schema, and grade content for public comprehension — without leaving your Claude host. The plugin bundles **five peer skills** and auto-registers the remote DTPR MCP at `https://api.dtpr.io/mcp`.

## Install

The plugin lives inside the `Helpful-Places/dtpr` repository. Installation paths differ per host:

**Claude Code**

```
/plugin marketplace add Helpful-Places/dtpr
/plugin install dtpr
```

Verify the MCP is live:

```
/mcp
```

You should see `dtpr` as a registered server. `/plugin list` should show `dtpr` as installed.

**Claude Cowork**

Upload the `plugin/dtpr/` directory via the Cowork plugin upload path. The bundled `.mcp.json` registers the remote MCP on install. Tool availability is probed at session start by `dtpr-describe-system` — see the capability matrix below.

**Claude.ai**

Upload the skill files individually through the Claude.ai skill-upload flow. The MCP tools run over HTTP and work independently of the skill-upload path. The `Task` tool is not available on Claude.ai, so the research corpus is effectively read-only from this host — research misses degrade to a logged gap in the output rather than dispatching a sub-agent.

## Hosts — capability matrix

Each skill probes its needed tools at session start (Phase 0 in `dtpr-describe-system`; inline degradation in the schema-tier and comprehension skills). The table below is the expected baseline; skills record actuals per session and degrade gracefully when a tool is missing.

| Capability | Claude Code | Claude Cowork | Claude.ai |
| --- | --- | --- | --- |
| MCP client | ✅ | ✅ | ✅ |
| `Read` (PDF, local files) | ✅ | Probe at session start | Unavailable |
| `WebFetch` (URLs) | ✅ | Probe at session start | Probe at session start |
| `Task` (research sub-agents) | ✅ | Probe at session start | Unavailable |
| `Write` (corpus entries) | ✅ | Probe at session start | Read-only |
| Recommended for | Full authoring loop | Team review; confirm capabilities at first use | Verbal describe + comprehension grading |

When a capability is listed as "Probe at session start", the expected behavior is host-dependent and not yet confirmed by a reference session. `dtpr-describe-system`'s Phase 0 trial-call-and-degrade protocol discovers what is actually available and surfaces that in the session narrative.

## Skills

The five skills are peers — no runtime router. Users (and the description router) pick based on the judgment tier the question lives at.

| Skill | Tier | Use when |
| --- | --- | --- |
| `dtpr-describe-system` | Instance | Describing a specific AI system as a validated DTPR datachain, optionally from a PDF, URL, or verbal description. |
| `dtpr-datachain-structure` | Meta-structure | Critiquing or proposing changes to the datachain-type shape itself (categories, requirements, retirement). |
| `dtpr-category-audit` | Category | Auditing one category's element collection for coherence, overlap, and gaps. |
| `dtpr-element-design` | Element | Drafting, editing, or retiring one element — its title, description, variables, and symbol direction. |
| `dtpr-comprehension-audit` | Comprehension | Grading any DTPR content (an element, a category, a datachain-instance, or pasted markdown) against the public-comprehension rubric. |

Each schema-tier skill (`dtpr-datachain-structure`, `dtpr-category-audit`, `dtpr-element-design`) emits the `pnpm --filter ./api schema:new <type> <YYYY-MM-DD>-beta` command line as a handoff — the skill does not invoke it. Human edits YAML in the resulting beta directory, validates with `schema:validate`, opens a PR.

## References

Read-only content the skills depend on:

- `references/comprehension-rubric.md` — the qualitative rubric `dtpr-comprehension-audit` applies and the three schema-tier skills inline. Seven checklist items (audience fit, plain-language, symbol legibility, ambiguity flags, locale coverage, variable-substitution clarity, overlap and distinctness) plus a holistic overall verdict.
- `references/comprehension-block-template.md` — the exact output shape of the inlined **Comprehension check** block, with a `Rubric version:` trailer. Copy verbatim; keep the bullets in order.

## Research corpus

`research/` is a file-based, author-seeded knowledge base that compounds across sessions. The first time a skill needs a framework (ISO 42001, NIST AI RMF), a regulatory text (EU AI Act), or a prior-art pattern (algorithmic-transparency notices), it dispatches a researcher via the `Task` tool (when available), captures the synthesis as a corpus entry, and every later session cites it instead of re-researching.

- `research/README.md` — corpus contract: slug convention, frontmatter schema, `authority_tier` enum, `applicability_tags` vocabulary, freshness + supersession, consumer-side degradation.
- `research/INDEX.md` — append-only flat table of every entry. `verify.mjs` confirms new rows were appended at EOF.
- **Privacy:** filenames prefixed with `_` are git-ignored (see `research/.gitignore`). Use that for citations you do not want in the public plugin payload — un-scrubbed regulatory drafts, internal memos, confidential vendor responses.

The corpus ships with the plugin but is **not pre-seeded**. Every entry comes from a real authoring session.

## Troubleshoot

| Symptom | Check |
| --- | --- |
| `/mcp` does not list `dtpr` | Rerun `/plugin install dtpr`; then `/plugin list` to confirm installation. |
| MCP tools time out or return 5xx | Hit `https://api.dtpr.io/healthz` — it should return `{"ok":true,…}`. If not, the upstream API is down. |
| Skills don't trigger on expected prompts | `/plugin list` should show `dtpr`. If it does, try an explicit phrasing like "use `dtpr-describe-system` for …". Skill descriptions evolve; see the skill files for current trigger language. |
| Validation errors reference an unknown element id | Ask the skill to re-list elements (`list_elements`) before constructing the datachain. Skills are instructed to only use returned IDs, but an agent can drift under pressure. |
| Corpus warning "no INDEX.md or malformed" | Normal on a fresh install before any research has been captured. Skills treat this as an empty corpus and continue. |
| `Task` tool unavailable (Claude.ai) | Research misses log a gap in the output instead of dispatching a sub-agent — this is expected on hosts without `Task`. |

## What the plugin is not

- A code SDK for DTPR — the MCP is HTTP and speaks JSON; bring any MCP client.
- A writer for the taxonomy itself — the schema-tier skills produce **proposals**. Applying them runs through `pnpm --filter ./api schema:new` and a standard PR review.
- A translator — locale coverage is graded by the comprehension rubric, but actual translation is out of scope for every skill.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes. 0.2.0 retires `dtpr-schema-brainstorm` in favor of the three schema-tier skills.

## Related links

- DTPR standard: <https://dtpr.io>
- API + MCP: <https://api.dtpr.io> (health: <https://api.dtpr.io/healthz>)
- MCP tool reference: <https://dtpr.ai/mcp/tools>
- Source: <https://github.com/Helpful-Places/dtpr>
