---
title: Concepts
description: Plain-language definitions of the terms the DTPR taxonomy, its icons and its datachains use, with examples from the current schema.
---

# Concepts

DTPR describes a technology by answering a fixed set of questions about it, using answers drawn from a shared list. This page defines the words used for the parts of that system. Each term has a short explanation, an example from the current schema, and a note on where it appears in the API.

The examples come from schema version `dtpr@2026-09-01-beta`. You can see all of it in the [taxonomy explorer](/taxonomy).

::feature{name="builder"}
Try the terms out in the [datachain builder](/taxonomy/builder).
::

## The taxonomy

### Taxonomy

The taxonomy is the full set of [categories](#category) and [elements](#element) published in one [schema version](#schema-version). There is one taxonomy, and it describes both physical devices and AI systems. A traffic camera, a public wifi network and a benefits eligibility model are all described with the same categories.

The current taxonomy has 14 categories and 139 elements.

::dev
In the API, you read the taxonomy through two lists: `GET /schemas/{version}/categories` and `GET /schemas/{version}/elements`. See the [categories](/docs/developers/rest-api/categories) and [elements](/docs/developers/rest-api/elements-list) reference pages.
::

### Schema version

A schema version is a dated publication of the taxonomy. Its identifier is written `{datachain type}@{date}`, with an optional `-beta` suffix. A beta version can still change. A stable version cannot, so anything built against it keeps working.

The current schema version is `dtpr@2026-09-01-beta`. It is a beta, so its text and elements may still be revised.

Every [datachain](#datachain) names the schema version it was written against, so a reader can always look up exactly what each element meant at the time. There is no "latest" shortcut. `GET /schemas` lists every version with its `id`, `status` (`beta` or `stable`), `created_at` and `content_hash`. See the [schemas](/docs/developers/rest-api/schemas) reference page.

### Datachain type

A datachain type defines which [categories](#category) a [datachain](#datachain) may contain, in what order, and which of them are required. It is the template every datachain follows.

The current type is `dtpr`. It lists 14 categories, [requires](#required-category) three of them (Purpose, Accountable and People affected), and declares one [subchain](#subchain). The type's name is the first half of the [schema version](#schema-version) identifier, which is why the version reads `dtpr@2026-09-01-beta`.

::dev
In the API, each category carries the type it belongs to in `datachain_type`, its position in `order`, and whether it is required in `required`.
::

### Category

A category is one question a [datachain](#datachain) answers about a system, such as who is accountable for it or what data it takes in. Each [element](#element) belongs to exactly one category. A category also sets the [shape](#shape) of its elements' icons, and may add a [context](#context) and [variables](#variable) to them.

The 14 categories of the `dtpr` type, in order:

| #  | Category              | Question it answers                                |
| -- | --------------------- | -------------------------------------------------- |
| 1  | Purpose               | What is the purpose of this AI system?             |
| 2  | Accountable           | Who is accountable for this AI system?             |
| 3  | People affected       | Who is this system used on?                        |
| 4  | What it does          | What is this system doing?                         |
| 5  | Risks & Mitigation    | What are the risks and how are they mitigated?     |
| 6  | Rights                | What are your rights?                              |
| 7  | Collection Technology | What captures the data this system uses?           |
| 8  | Input Data            | What input data does this AI system process?       |
| 9  | Algorithm or Model    | What algorithm or model processes the data?        |
| 10 | Output Data           | What does this AI system produce?                  |
| 11 | Manifestation         | How do people encounter what this system produces? |
| 12 | Data Access           | Who has access to the data?                        |
| 13 | Data Retention        | How long is the data kept?                         |
| 14 | Data Storage          | Where is the data stored?                          |

The questions are quoted as the schema publishes them. Some still say "AI system", but every category applies to devices as well.

::dev
In the API, a category has an `id` (for example `input_dataset`), a `name`, a `description`, a `prompt` (the question), a `shape`, `required`, `order`, an optional `element_context`, and `element_variables`.
::

### Required category

A required category is one that every [datachain](#datachain) must answer. The [datachain type](#datachain-type) decides which. The rest are optional: a datachain answers them when they apply to the system.

The `dtpr` type requires the three answers a person needs before anything else makes sense: what the system is for, who answers for it, and whether it affects them. The others depend on what kind of system it is.

| Category              | Required | Why                                                                                                                         |
| --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| Purpose               | Yes      | Every other answer is read against what the system is for. Without it, no one can judge whether the rest is reasonable.     |
| Accountable           | Yes      | People need someone to hold responsible and to contact. A system nobody answers for cannot be questioned.                   |
| People affected       | Yes      | People need to know whether the system touches them, including those who never chose to use it.                            |
| What it does          | No       | The purpose often says it already. Name the actions when the system senses, decides or acts in ways the purpose leaves out. |
| Risks & Mitigation    | No       | Not every system carries a risk worth naming. Answer it whenever a risk is known.                                           |
| Rights                | No       | Some systems offer nothing beyond the general law. Answer it when people can access, contest or opt out.                    |
| Collection Technology | No       | Only systems that capture data in the world use a device for it. One that works from existing records has none.            |
| Input Data            | No       | Some devices, such as a gate or a display, take no data in. Answer it when the system processes data.                       |
| Algorithm or Model    | No       | Some devices pass data on without processing it. Answer it when something turns inputs into outputs.                        |
| Output Data           | No       | Some systems only collect. Answer it when the system produces decisions, content or actions of its own.                     |
| Manifestation         | No       | Some outputs stay inside other systems and never reach people. Answer it when people meet the output.                      |
| Data Access           | No       | Only a system that keeps or shares data has anyone to give access to.                                                       |
| Data Retention        | No       | A system that keeps no data has no retention period to state.                                                               |
| Data Storage          | No       | A system that keeps no data has nowhere to store it.                                                                        |

The [validate](/docs/developers/rest-api/validate) endpoint reports each required category a datachain leaves out.

::dev
In the API, a category's `required` is `true` or `false`.
::

### Element

An element is one possible answer within a [category](#category). It has a title, a description and an [icon](#icon). Describing a system means choosing the elements that apply to it.

For example, the Collection Technology category has 13 elements, including Camera, Microphone and Environmental Sensor. The Camera element's description says it captures still images or video of a place, and that it may be mounted on a pole, a vehicle or a drone, or built into a device.

::dev
In the API, an element has an `id` (`camera`), a `category_id` (`collection`), a `title`, a `description`, a `symbol_id`, a `shape`, its `variables`, and `icon_variants`. See the [element detail](/docs/developers/rest-api/element-detail) reference page.
::

### Context

A context is a dimension a [category](#category) adds to its [elements](#element). It records something the element alone does not say. Each time an element from that category is used in a [datachain](#datachain), the author picks one [context value](#context-value).

Five categories have a context:

| Category        | Context              | What it records                                           |
| --------------- | -------------------- | --------------------------------------------------------- |
| Accountable     | Role                 | How the organisation takes part in the deployment         |
| People affected | Relationship         | How the system touches this person or group               |
| What it does    | Human involvement    | How much runs without a person                            |
| Input Data      | Personal Information | How identifiable the data is when the system processes it |
| Output Data     | Personal Information | How identifiable the data is when the system produces it  |

For example, the Biometric data element says what the data is about. The Personal Information context says how directly it identifies a person.

::dev
In the API, a category's context is its `element_context`, with an `id` (`role`, `relationship`, `autonomy` or `pii`), a `name`, a `description` and a list of `values`. Human involvement is marked optional (`required: false`), so an author can leave it out.
::

### Context value

A context value is one option within a [context](#context). A value with a colour changes the [icon](#icon). A value without a colour is shown as a tag next to the element.

The Personal Information context has three values, each with a colour: Anonymized data (blue, `#4A90D9`), Pseudonymous data (purple, `#9575CD`) and Identifiable data (yellow, `#FFD700`). Human involvement also has three coloured values: A person decides, A person oversees or carries it out, and Runs on its own. The Role context has two values with no colour, Vendor and Deployer. The Relationship context has three with no colour: Decided about, Caught incidentally and Wider community.

::dev
In the API, each value has an `id` (for example `identifiable`), a `name`, a `description` and a `color`, which is `null` when the value has no colour. A datachain records the chosen value in `context_type_id`.
::

### Variable

A variable is a blank that a [datachain](#datachain) fills in for one use of an [element](#element). Variables carry the details that differ from one system to the next, such as the name of the accountable organisation.

Some variables appear as a placeholder in the element's own text. The Data Retention element titled "Retained {{ duration }}" has the description "Data is stored for {{ duration }}, and after this time period is deleted". A datachain that sets `duration` to "30 days" turns that into a complete sentence. Other variables add text alongside the element. Elements in the Accountable category have a required `title` and `description`, which hold the organisation's name and what it does. Most other categories offer an optional `additional_description`.

::dev
In the API, a category declares its variables in `element_variables`, and each element lists them in `variables`, with an `id`, a `label`, `required` and a `kind`. A datachain supplies the values in each element's `variables` list.
::

### Subchain

A subchain is a named, ordered run of [categories](#category) inside a [datachain type](#datachain-type) that describes one flow. It lets a [datachain](#datachain) show those categories together as a sequence.

The `dtpr` type has one subchain, Data Flow (`data_flow`). It follows data through a system in five steps: Collection Technology, Input Data, Algorithm or Model, Output Data, Manifestation. Read in order, it says what captures the data, what the data is, what processes it, what comes out, and how people encounter the result.

A system with more than one flow can repeat the subchain. A datachain lists each use in `subchain_instances`, giving it an `id` and a `subchain_id` of `data_flow`, and each element in that flow points to it with `subchain_instance_id`. Elements outside any flow, such as Purpose or Rights, sit at the top level of the datachain.

## Icons

### Symbol

A symbol is the pictogram that identifies an [element](#element). It is the drawing in the middle of the [icon](#icon), without any outline.

The Camera element's symbol is a camera. The Organization element's symbol is a building.

::dev
In the API, an element names its symbol in `symbol_id` (`camera`, `building`). The drawing is served as an SVG at `GET /schemas/{version}/symbols/{symbol_id}.svg`.
::

### Shape

A shape is the outline around a [symbol](#symbol). The shape is set by the [category](#category), so every element in a category has the same one. This lets a reader tell what kind of thing an element is before reading its title.

There are four shapes:

| Shape          | Categories that use it                                                                    | What it signals                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Hexagon        | Purpose, Accountable, People affected, What it does, Collection Technology, Manifestation | The system itself: why it exists, who is involved, what it does, and the points where it meets the world |
| Circle         | Input Data, Algorithm or Model, Output Data                                               | Data in motion: what goes in, what processes it, and what comes out                                      |
| Rounded square | Data Access, Data Retention, Data Storage                                                 | Data at rest: who can reach it, how long it is kept, and where                                           |
| Octagon        | Risks & Mitigation, Rights                                                                | Guardrails: what could go wrong and what you can do about it                                             |

The pairing of shapes and meanings is a design convention. The schema does not enforce it.

::dev
In the API, the shape appears as `shape` on both the category and its elements, with the values `hexagon`, `circle`, `rounded-square` and `octagon`.
::

### Icon

An icon is a [symbol](#symbol) placed inside its [shape](#shape). It is what appears on a sign or a screen to stand for an [element](#element). An icon has variants for dark backgrounds and for each [context value](#context-value).

The Recommends element, in the What it does category, has a plain icon, a dark one, and a pair for each Human involvement value. Choosing "A person decides" gives the teal version.

::dev
In the API, an element lists its variants in `icon_variants`, for example `default`, `dark`, `human_decides` and `human_decides.dark`. Each variant is served as an SVG at `GET /schemas/{version}/elements/{element_id}/icon.{variant}.svg`. See the [icon routes](/docs/developers/rest-api/icons) reference page.
::

## Datachains

### Datachain

A datachain is a description of one system, made by choosing [elements](#element) from the taxonomy and filling in their [context values](#context-value) and [variables](#variable). The schema calls this a datachain instance. A datachain is what ends up on a sign, a web page or a notice.

A small datachain for a resume screening tool might choose Employment & Work as its purpose, name the organisation that runs it, say who it is used on, and say what it does:

```json
{
  "id": "acme-resume-screener",
  "schema_version": "dtpr@2026-09-01-beta",
  "created_at": "2026-09-01T00:00:00Z",
  "elements": [
    { "element_id": "employment" },
    {
      "element_id": "organization",
      "context_type_id": "deployer",
      "variables": [
        { "id": "title", "value": [{ "locale": "en", "value": "Acme Corp" }] },
        { "id": "description", "value": [{ "locale": "en", "value": "Runs the screener and makes the final hiring decision." }] }
      ]
    },
    {
      "element_id": "people",
      "context_type_id": "subject",
      "variables": [
        { "id": "title", "value": [{ "locale": "en", "value": "Job applicants" }] },
        { "id": "description", "value": [{ "locale": "en", "value": "Anyone who submits a resume for an open role." }] }
      ]
    },
    { "element_id": "recommends", "context_type_id": "human_decides" }
  ]
}
```

Each entry names an element by `element_id`. The category is not repeated, because every element belongs to exactly one. This example covers the three required categories and one optional one.

::feature{name="builder"}
You can compose a datachain in the [builder](/taxonomy/builder).
::

To check a datachain against a schema version, use `POST /schemas/{version}/validate`, described on the [validate](/docs/developers/rest-api/validate) reference page.

### Resolved datachain

A resolved datachain is a [datachain](#datachain) bundled with the [categories](#category) and [elements](#element) it refers to. It can be displayed without another lookup, which suits signs, saved files and anything that has to work offline.

Resolving the resume screener example above would add the full text and icon details for Employment & Work, Organization, People and Recommends, along with their four categories. Only what the datachain uses is included.

::dev
In the API, a resolved datachain has everything a datachain has, plus a `schema_snapshot` holding the `datachain_type`, `categories` and `elements`. `POST /schemas/{version}/resolve` turns a datachain into a resolved one. See the [resolve](/docs/developers/rest-api/resolve) reference page.
::

### Locale

A locale is a language the taxonomy's text is published in. Each [schema version](#schema-version) lists its own locales. The taxonomy locale is chosen separately from the language of the site or sign around it, so an English page can show the taxonomy in French.

`dtpr@2026-09-01-beta` lists eleven locales: `en`, `fr`, `es`, `pt`, `fil`, `km`, `vi`, `zh-Hans`, `zh-Hant`, `nl` and `de`. In French, the Purpose category is named "But".

::dev
In the API, every piece of text is a list of `{ "locale", "value" }` pairs, one per language. Pass `?locales=en` (or several, separated by commas) to receive only the languages you need. A schema version's locales are listed in its manifest, at `GET /schemas/{version}/manifest`.
::
