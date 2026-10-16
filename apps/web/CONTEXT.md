# DTPR website

The public website for DTPR (Digital Trust for Places and Routines). It explains the standard, documents it, and lets visitors browse the taxonomy and compose datachains. The DTPR API is the source of truth for the taxonomy, and this glossary uses the schema's wording.

## Language

### Audiences

**Deployer**:
An organization that uses DTPR to describe a technology it runs, on signs, on a web portal or in community workshops. A deployer need not touch the API.
_Avoid_: User, customer, client

**Developer**:
Someone building on DTPR through the REST API or the MCP server.

**Agent skill**:
One of the seven `SKILL.md` files in `plugin/dtpr/skills` that let an AI coding assistant describe a system as a datachain, audit or extend the taxonomy, or grade content for comprehension. The Claude plugin is one way to install them; the MCP server also serves them as prompts.
_Avoid_: Claude skill

**Guide**:
The Get Started page: one page that explains what DTPR is and how it works. Distinct from the **Docs**.
_Avoid_: Getting started docs

**Docs**:
The deployer docs, the developer docs and the Concepts page they share, under `/docs`.

### The taxonomy

**Taxonomy**:
The full set of categories and elements published in one schema version. There is one taxonomy, and it describes both physical devices and AI systems.
_Avoid_: Device taxonomy, AI taxonomy

**Schema version**:
A dated release of the taxonomy, identified as `{datachain type}@{date}` with an optional `-beta` suffix. A beta version can still change; a stable one cannot.
_Avoid_: Release, API version

**Datachain type**:
The definition of which categories a datachain may contain, in what order, and which are required. The current type is `dtpr`.

**Category**:
One question a datachain answers about a system, such as who is accountable or what data is collected. Each element belongs to exactly one category.
_Avoid_: Section, group

**Element**:
One possible answer within a category, with a title, a description and an icon.
_Avoid_: Item, concept, icon (when the whole element is meant)

**Context**:
A dimension a category adds to its elements, such as how identifiable the data is. Each use of an element in that category picks one context value.

**Context value**:
One option within a context. A value with a colour changes the icon; a value without one is shown as a tag.

**Variable**:
A blank in an element's description that a datachain fills in, such as the name of the accountable organisation.

**Subchain**:
A named, ordered run of categories inside a datachain type that describes one flow, such as data moving from collection to output.

### Icons

**Symbol**:
The pictogram that identifies an element.

**Shape**:
The outline around a symbol. The shape is set by the category, so it signals what kind of thing an element is.

**Icon**:
A symbol placed inside its shape. An icon has variants for dark backgrounds and for each coloured context value.

### Datachains

**Datachain**:
A description of one system, made by choosing elements from the taxonomy and filling in their context values and variables. The schema calls this a datachain instance.
_Avoid_: Data chain, disclosure, label

**Resolved datachain**:
A datachain bundled with the categories and elements it refers to, so it can be displayed without another lookup.

**Locale**:
A language the taxonomy's text is published in. Each schema version lists its own locales. The taxonomy locale is chosen separately from the language of the site around it.
_Avoid_: Site language (when the taxonomy's language is meant)

**Translation status**:
How far a locale's text has been checked for a schema version: unverified, machine draft, machine reviewed or human reviewed.

**Translation flag**:
An open question a reviewer raised about specific translated strings, such as a term choice or a passage that needs a fluent speaker.
