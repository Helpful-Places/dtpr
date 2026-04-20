---
template_version: 2026-04-20
---

# Comprehension block template

Schema-tier skills (`dtpr-datachain-structure`, `dtpr-category-audit`, `dtpr-element-design`) inline a **Comprehension check** block in their proposal output. `dtpr-comprehension-audit` uses the same shape when invoked standalone.

Both read the rubric from `comprehension-rubric.md` and render findings using the shape below. Copy the shape verbatim; the bullets map 1:1 onto rubric items.

## Shape

    ## Comprehension check

    - **Audience fit:** pass|fail|partial|n/a — <one-line reason>
    - **Plain-language:** pass|fail|partial|n/a — <one-line reason>
    - **Symbol legibility:** pass|fail|partial|n/a — <one-line reason>
    - **Ambiguity flags:** pass|fail|partial|n/a — <one-line reason>
    - **Locale coverage:** pass|fail|partial|n/a — <one-line reason>
    - **Variable-substitution clarity:** pass|fail|partial|n/a — <one-line reason>
    - **Overlap and distinctness:** pass|fail|partial|n/a — <one-line reason>
    - **Overall:** pass|fail|partial — <one-line summary of what to fix before shipping>

    Rubric version: <YYYY-MM-DD from comprehension-rubric.md frontmatter>

## Rules

- One bullet per rubric item, in the order above. Do not reorder or skip items; mark inapplicable items **n/a** with a reason.
- The `<one-line reason>` must name the specific phrase, element, or pattern that drove the verdict. "pass — reads cleanly" is not a reason; "pass — 'who sees your data' avoids jargon" is.
- The `Rubric version:` trailer carries the `rubric_version` from the frontmatter of `comprehension-rubric.md` at the time of the audit. When the rubric evolves, prior audits remain interpretable — callers re-grade by re-running the skill.
- The block lives under a skill's own output (schema-tier skills place it between the proposal and the `schema:new` handoff line; `dtpr-comprehension-audit` uses it as the main output).
