---
name: dtpr-schema-brainstorm
description: Brainstorm and critique the structure of the DTPR (Digital Trust for Places and Routines) schema itself — its AI datachain categories, elements, variables, and locale coverage. Use whenever a user wants to iterate on DTPR taxonomy, identify gaps for new AI patterns, evaluate whether the current schema captures a novel scenario, or propose taxonomy edits. Triggers on phrases like "does DTPR cover", "propose a new element", "brainstorm DTPR", "what's missing from the schema", "critique the taxonomy", "how should DTPR handle", or any request to shape DTPR itself rather than use it. Output is a concrete schema-edit proposal plus the shell command line to start a new beta draft.
---

# Brainstorm the DTPR schema

This skill is a working partner for iterating on DTPR itself. Given a scenario the schema may not cover well, it loads the current taxonomy, stress-tests it against the scenario, and produces a **concrete edit proposal** — which elements to add, edit, or retire, with reasoning.

The skill does **not** modify files under `api/schemas/`. That edit cycle is human-driven: run the suggested `schema:new` command, hand-edit YAML in the resulting beta directory, validate with `schema:validate`, open a PR.

If the user instead wants to *describe a specific AI system* using DTPR (rather than shape the schema itself), use `dtpr-describe-system` instead.

## When to use

- User wants to propose a new element, category, or variable.
- User identifies a scenario that DTPR handles awkwardly and wants to think through a fix.
- User asks "does DTPR cover X?" as a prelude to schema work.
- User wants to stress-test the schema against emerging patterns (new LLM failure modes, new data-handling regimes, new rights frameworks).

If the user just wants to document an existing system with DTPR, route to `dtpr-describe-system` — do not draft taxonomy changes for systems that can already be described with today's elements.

## Workflow

### Phase 1 — Load the current schema

| Tool | Purpose |
| --- | --- |
| `list_schema_versions` | Find the newest version; prefer `status: stable` if present, else the most recent `status: beta`. |
| `get_schema` with `include: "full"` | Pull the manifest, datachain-type, every category, and every element (with their variables) in one call. |

Capture the version string and locale allow-list — any proposal may need to address locale coverage too.

### Phase 2 — Frame the scenario

Ask the user to describe one scenario in concrete terms — real or hypothetical. Surface gaps by walking DTPR's axes:

- **Purpose** — what decision or task is automated?
- **Inputs** — what data feeds it, from where, for how long?
- **Mechanism** — rule-based, statistical, generative, multi-model?
- **Outputs** — what does the system do with its decision (notify, act, log, route)?
- **Rights & recourse** — how does a person affected contest, opt out, or audit?

Don't draft elements yet. Get the scenario fully articulated first.

### Phase 3 — Gap analysis

For each DTPR category, check the scenario against the current elements:

- **Covered cleanly** — note which element(s) apply.
- **Covered awkwardly** — element applies but a variable or new field would clarify intent.
- **Not covered** — no element in this category captures the scenario; a new element is likely needed.

Use `list_elements` with `category_id` and `query` to search. Use `get_elements` (bulk) to inspect candidates in depth. If the user is uncertain whether an element captures the nuance, re-read its description and variables rather than guessing.

Note boundary cases where two elements overlap, or where a variable (not a new element) would be the right fix. A new variable on an existing element is usually cheaper than a new element.

### Phase 4 — Draft the proposal

Produce a Markdown proposal with this structure:

```
## Scenario
<one paragraph summarizing the user's scenario>

## Gaps in <version>
- <one bullet per gap, naming the category and the failure mode>

## Proposed changes
### Add
- element `<proposed_id>` in category `<category_id>`:
  - title: "<short title>"
  - description: "<short description>"
  - variables: <list or "none">
  - rationale: <why this closes the gap>
### Edit
- element `<existing_id>`: <what changes and why>
### Retire
- element `<existing_id>`: <why it should go, migration plan>

## Validation check
<result of re-validating a representative datachain against the
 current beta — included only if validate_datachain was invoked>

## Next step
pnpm --filter ./api schema:new <type> <YYYY-MM-DD>-beta
```

Keep the proposal terse — one bullet per change, one-to-two sentences of rationale. The user edits YAML directly after; verbose rationale rots.

The final `schema:new` command line is a suggestion for the user to run themselves. **This skill does not invoke the CLI or modify files under `api/schemas/`.**

## Validation canary (optional)

When the user wants sanity-checking that a proposed revision wouldn't regress existing datachains, call `validate_datachain` with a representative instance against the current beta and note the result. If today's chains already fail, the proposal probably starts from the wrong premise — surface that to the user before proceeding.

## Tool reference

| Tool | When used |
| --- | --- |
| `list_schema_versions` | Phase 1, once. |
| `get_schema` | Phase 1, once with `include: "full"`. |
| `list_categories` | Phase 3 if the datachain-type alone isn't enough context. |
| `list_elements` | Phase 3 per category and per `query`. |
| `get_elements` | Phase 3 bulk fetch when inspecting candidates. |
| `validate_datachain` | Phase 4 (optional) regression canary. |

Tool parameter shapes live on the MCP itself (`/mcp` → `tools/list`). This skill names tools in workflow order only.

## Non-goals

- Writing final YAML for `api/schemas/`. The user edits by hand after running `schema:new`.
- Approving or landing schema changes. The skill's output is a *proposal*; review, validation, and PR review happen in the normal code-review flow.
- Describing a specific system with existing DTPR elements — that's `dtpr-describe-system`.
