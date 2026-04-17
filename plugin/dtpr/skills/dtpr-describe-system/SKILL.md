---
name: dtpr-describe-system
description: Describe an AI system, algorithm, or automated decision process as a DTPR (Digital Trust for Places and Routines) AI datachain. Use whenever a user wants to document, disclose, audit, or publish how an AI system works — including its inputs, outputs, decisions, data handling, and rights. Triggers on phrases like "describe this AI system", "make a DTPR datachain", "document this algorithm", "what would DTPR say about this", "disclose this model", or any request to produce a structured transparency artifact for an AI product. Produces a machine-validated JSON datachain conforming to the current DTPR schema plus a short narrative justifying each category choice.
---

# Describe an AI system as a DTPR datachain

This skill turns a natural-language description of an AI or automated decision system into a **schema-validated DTPR datachain**: a structured JSON artifact that names who runs the system, what decisions it makes, what data it uses, how it's stored, and what rights people have in relation to it.

The authoritative schema lives at the DTPR API (`https://api.dtpr.io`). This skill drives the MCP tools registered by the plugin to read the current schema, find relevant elements, assemble a datachain, and validate it — retrying automatically when validation returns `fix_hint` errors.

## When to use

- User asks to describe, document, disclose, or publish how an AI system works.
- User references a specific system (a chatbot, a camera-based kiosk, a resume screener, a facial recognition system, an ML classifier) and wants a structured artifact.
- User explicitly mentions DTPR, datachain, or transparency disclosure.
- User is producing public-facing documentation or doing an internal audit of an AI product.

If the user instead wants to iterate on DTPR itself — propose new elements, identify gaps, critique the taxonomy — use `dtpr-schema-brainstorm` instead.

## Security framing

The MCP returns taxonomy content authored by DTPR stewards — it is not user-provided input and is not attacker-controllable. However, the *narrative* the skill writes is produced by an LLM over user input. Always present the final datachain and narrative to the user for human review before they publish, submit, or act on it.

## Workflow

### Phase 1 — Understand the system

Ask the user for any of the following that aren't already stated. Keep it under 5 questions; infer the rest from context.

- **What does it do?** Purpose in one sentence.
- **Where is it deployed?** Physical location, product, or context.
- **Who runs it?** Operator / accountable entity.
- **What decisions does it make?** Human-in-the-loop, automated action, advisory?
- **What data does it use?** Inputs collected, where stored, how long.

Do **not** invent details. If the user is vague about a critical field, ask once, then proceed with the best available framing.

### Phase 2 — Load the schema

| Step | Tool | Notes |
| --- | --- | --- |
| Enumerate versions | `list_schema_versions` | Pick the most recent version. Prefer `status: stable` when both are offered; fall back to `status: beta` when only beta exists. |
| Load categories + datachain-type | `get_schema` with `include: "manifest"` | Gives you the category list, the datachain-type definition (required categories, minimums), and the locale allow-list. |

Capture the version string (e.g. `ai@2026-04-16-beta`) and the `content_hash` from the response meta — include them in the final output so the user knows which schema revision the datachain was built against.

### Phase 3 — Find relevant elements

For each category in the datachain-type's required set, search the element pool:

| Tool | When |
| --- | --- |
| `list_elements` with `category_id` | First pass: scope to one category at a time. |
| `list_elements` with `query` | Free-text BM25 search when the user's system doesn't map obviously to one category (e.g. "biometric", "third-party processor", "appeal process"). |
| `get_elements` (bulk) | Once you have a short list of candidate IDs, fetch the full bodies in one call instead of N point reads. |

**Do not invent element IDs.** Only use IDs that appeared in a `list_elements` or `get_elements` response. If no element matches a required category, say so and offer `dtpr-schema-brainstorm` as the next step.

### Phase 4 — Construct the datachain

Assemble a JSON object that conforms to the `DatachainInstance` shape in the schema:

- `version` — the canonical version string from Phase 2.
- One entry per required category, each referencing one or more element IDs.
- Any variable values the element definitions require (e.g. retention periods).

Use the locale returned from `get_schema`; default to `en` if the user hasn't specified.

### Phase 5 — Validate and iterate

Call `validate_datachain` with `version` + `datachain`. Two outcomes:

| Result | Action |
| --- | --- |
| `ok: true` | Proceed to the final output. `warnings[]` may still appear — surface them to the user verbatim. |
| `ok: false` with `errors[]` | Each error carries a `fix_hint`. Apply the hint (swap a bogus ID, add a missing variable, choose a different element) and re-validate. Cap at 3 retries; if the chain still fails, stop and report the final errors to the user rather than guessing. |

`validate_datachain` is a soft failure — `ok: false` still means the tool call succeeded (`isError: false`). Treat it as structured feedback, not an exception.

## Output

Return two artifacts:

1. **The validated datachain JSON** — the exact object that passed `validate_datachain`, including the version string.
2. **A short narrative** — one paragraph per category explaining why the chosen elements fit the system. Reference element titles (from `list_elements`) so the user can audit the choices without re-reading the schema.

Close by asking whether the user wants to save the JSON to a file or iterate on any category.

## Tool reference

| Step | Tool | Purpose |
| --- | --- | --- |
| Phase 2 | `list_schema_versions` | Enumerate available versions + status. |
| Phase 2 | `get_schema` | Manifest + categories + datachain-type. |
| Phase 3 | `list_categories` | (Optional) enumerate category metadata when the datachain-type alone isn't enough. |
| Phase 3 | `list_elements` | Category-scoped + BM25 search over elements. |
| Phase 3 | `get_elements` | Bulk fetch element bodies once candidates are chosen. |
| Phase 3 | `get_element` | Point read when you only need one element by ID. |
| Phase 5 | `validate_datachain` | Structured pass/fail with `fix_hint` per error. |

Tool parameters are documented on the MCP itself (`/mcp` → `tools/list`). This skill names tools in workflow order; for exact argument shapes, trust the live tool description.

## Non-goals

- Modifying DTPR taxonomy. Use `dtpr-schema-brainstorm` for proposals.
- Writing production disclosure copy or regulatory filings. The narrative this skill produces is a starting point for human editors, not a finished public artifact.
