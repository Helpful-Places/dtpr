---
title: Attribution
description: Licence terms for DTPR and the research the taxonomy adapts, with the citation and licence for each external source.
---

DTPR is an open standard. This page documents its licence and the additional licence terms that apply to content adapted from external research.

::callout{type="info"}
Citing DTPR in your own work? See [Cite DTPR](/docs/cite) for the canonical citation, BibTeX and a downloadable `.bib` file.
::

## DTPR

The DTPR standard, its icons, taxonomy, these docs, the MCP server, the REST API and the agent skills, is licensed under the [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) licence, as established by the original Digital Transparency in the Public Realm contributors in 2019 and maintained by [Helpful Places](https://helpfulplaces.com/).

Portions of the DTPR icons incorporate elements of, or are derived from, the [Material Symbols and Icons](https://material.io/tools/icons/), available under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).

## Research foundations

Where content in the taxonomy is adapted from external research, the source is documented here with its full citation and any additional licence terms.

### Risks taxonomy (`risks_mitigation`)

The risk taxonomy in the Risks & Mitigation category is adapted from the **AIAAIC Collaborative, Human-Centred Taxonomy of AI, Algorithmic, and Automation Harms**. AIAAIC's nine harm types, Autonomy, Physical, Psychological, Reputational, Financial & Business, Human Rights & Civil Liberties, Societal & Cultural, Political & Economic and Environmental, organise the DTPR risk category from the affected person's perspective: *what could happen to a person*, not *where the failure originates in the system*.

Abercrombie, G., Benbouzid, D., Giudici, P., Golpayegani, D., Hernandez, J., Noro, P., Pandit, H., Paraschou, E., Pownall, C., Prajapati, J., Sayre, M. A., Sengupta, U., Suriyawongkul, A., Thelot, R., Vei, S. and Waltersdorfer, L. (2024). *A Collaborative, Human-Centred Taxonomy of AI, Algorithmic, and Automation Harms*. arXiv preprint. [doi:10.48550/arXiv.2407.01294](https://doi.org/10.48550/arXiv.2407.01294). Licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

```bibtex
@misc{aiaaic2024,
  title        = {A Collaborative, Human-Centred Taxonomy of AI, Algorithmic, and Automation Harms},
  author       = {Abercrombie, Gavin and Benbouzid, Djallel and Giudici, Paolo and Golpayegani, Delaram and Hernandez, Julio and Noro, Pierangela and Pandit, Harshvardhan and Paraschou, Eva and Pownall, Charlie and Prajapati, Jyoti and Sayre, Mark A. and Sengupta, Ushnish and Suriyawongkul, Arthit and Thelot, Renee and Vei, Sofia and Waltersdorfer, Laura},
  year         = {2024},
  eprint       = {2407.01294},
  archivePrefix= {arXiv},
  primaryClass = {cs.LG},
  doi          = {10.48550/arXiv.2407.01294},
  url          = {https://doi.org/10.48550/arXiv.2407.01294},
  note         = {Licensed CC BY-SA 4.0}
}
```

Licence confirmed on the arXiv paper and the [OECD.AI catalogue entry for the AIAAIC Repository](https://oecd.ai/en/catalogue/tools/aiaaic-repository). The living taxonomy and its underlying incident database (1,500+ documented incidents as of mid-2024) are maintained at [aiaaic.org](https://www.aiaaic.org/).

## Licence summary

| Surface | Licence |
| --- | --- |
| DTPR icons, taxonomy and these docs | CC BY 4.0 |
| MCP server, REST API, agent skills | CC BY 4.0 |
| Risk elements adapted from AIAAIC in the `risks_mitigation` category | **CC BY-SA 4.0** (inherited from AIAAIC) |
| Material Symbols incorporated into icons | Apache License 2.0 |

The ShareAlike clause on AIAAIC-derived content is scoped to the risk-taxonomy content itself. Downstream users who redistribute or modify the `risks_mitigation` element definitions must distribute their modifications under CC BY-SA 4.0. The rest of DTPR remains CC BY 4.0.

## Contributing back

Gaps or extensions identified while authoring the DTPR risk catalogue that are also relevant to AIAAIC's general-purpose taxonomy, for example harm framings specific to AI deployment, will be proposed back to the [AIAAIC working group](https://www.aiaaic.org/) as upstream contributions, in the spirit of the ShareAlike licence.

## Per-element citation

Every category or element adapted from an external source also carries that source in its `sources[]` array. For the risk taxonomy it sits on the `risks_mitigation` category; other elements, such as those shaped by the EU AI Act, carry their own. Each entry has `{ type, title, url, citation }`, and you can read it through the MCP [`get_element`](/docs/developers/mcp-server/tools/get-element) tool or the REST [element detail](/docs/developers/rest-api/element-detail) endpoint. The `sources[]` array is the authoritative record; this page is the human-readable summary.
