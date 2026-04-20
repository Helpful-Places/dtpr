---
title: DTPR for AI
description: MCP server, REST v2 API, icon composition, UI library, and the Claude authoring plugin for the Digital Trust for Places & Routines standard.
navigation: false
---

**DTPR for AI** is the AI-focused surface of the [Digital Trust for Places & Routines](https://docs.dtpr.io) standard. It bundles five integration surfaces so an AI agent, a web client, a server-side renderer, or an authoring team inside Claude can describe data-collecting technologies in public spaces with a shared vocabulary.

::card-group
  ::card{title="MCP server" to="/mcp"}
  9 tools and 1 resource over Streamable HTTP at `https://api.dtpr.io/mcp` — list, fetch, validate, render, resolve icons.
  ::

  ::card{title="REST API (v2)" to="/rest"}
  Public, read-only JSON + SVG API at `https://api.dtpr.io/api/v2`. Schemas, categories, elements, validation, icons.
  ::

  ::card{title="Icon composition" to="/icons"}
  Shape × symbol × variant pipeline. Compose 36×36 SVG icons pinned to a schema release.
  ::

  ::card{title="@dtpr/ui" to="/ui"}
  Framework-neutral helpers, Vue components, and SSR HTML renderer. Ships with MCP Apps support.
  ::

  ::card{title="Claude plugin" to="/plugin"}
  Five-skill authoring studio for Claude Code, Cowork, and Claude.ai. Describe AI systems, iterate on the DTPR schema, grade content for public comprehension.
  ::
::

## Quickstarts

- [MCP in five minutes](/getting-started/mcp-quickstart) — `initialize` → `tools/call` → `resources/read`.
- [REST in three calls](/getting-started/rest-quickstart) — list schemas, fetch elements, validate a datachain.
- [UI in a Vue app](/getting-started/ui-quickstart) — render a datachain with `<DtprDatachain>`.
- [Install the Claude plugin](/plugin/install) — authoring studio for Claude Code, Cowork, and Claude.ai.

## Background

- [What is DTPR for AI?](/getting-started) — Who this documentation is for.
- [Concepts](/concepts) — Datachains, elements, categories, versions, content hashes.
- [Changelog](/changelog) — What landed when.

For the full DTPR standard — design principles, signage, governance, v1 REST — see [docs.dtpr.io](https://docs.dtpr.io).
