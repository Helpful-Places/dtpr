# DTPR Claude Code plugin

Describe AI systems as DTPR datachains and brainstorm the DTPR schema itself — without leaving Claude Code. The plugin bundles two agent skills and auto-registers the remote DTPR MCP at `https://api.dtpr.io/mcp`.

## Install

The plugin lives inside the `Helpful-Places/dtpr` repository. Add the repo as a marketplace, then install:

```
/plugin marketplace add Helpful-Places/dtpr
/plugin install dtpr
```

Verify the MCP is live:

```
/mcp
```

You should see `dtpr` as a registered server. `/plugin list` should show `dtpr` as installed.

## Skills

### `dtpr-describe-system`

Takes a natural-language description of an AI system (a facial-recognition parking kiosk, a resume screener, a 311 chatbot) and drives the DTPR MCP tools to produce a schema-validated datachain plus a narrative explanation of the choices. Use when a user wants to document, disclose, or audit how an AI system makes decisions.

### `dtpr-schema-brainstorm`

Explores gaps in the DTPR taxonomy by loading the current schema and stress-testing it against a real or hypothetical AI system. Produces a concrete schema-edit proposal and the `schema:new` command line to start drafting it. Use when iterating on DTPR itself.

## Troubleshoot

| Symptom | Check |
| --- | --- |
| `/mcp` does not list `dtpr` | Rerun `/plugin install dtpr`; then `/plugin list` to confirm installation. |
| MCP tools time out or return 5xx | Hit `https://api.dtpr.io/healthz` — it should return `{"ok":true,…}`. If not, the upstream API is down. |
| Skills don't trigger on expected prompts | `/plugin list` should show `dtpr`. If it does, try an explicit phrasing like "use dtpr-describe-system for …". Skill descriptions evolve; see the skill files for current trigger language. |
| Validation errors reference an unknown element id | Ask the skill to re-list elements (`list_elements`) before constructing the datachain. Skills are instructed to only use returned IDs, but an agent can drift under pressure. |

## What the plugin is not

- A code SDK for DTPR — the MCP is HTTP and speaks JSON; bring any MCP client.
- A writer for the taxonomy itself — `dtpr-schema-brainstorm` produces *proposals*. Applying them runs through `pnpm schema:new` and a standard PR review.

## Related links

- DTPR standard: <https://dtpr.io>
- API + MCP: <https://api.dtpr.io> (health: <https://api.dtpr.io/healthz>)
- Source: <https://github.com/Helpful-Places/dtpr>
