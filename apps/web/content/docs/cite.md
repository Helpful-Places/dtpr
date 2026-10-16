---
title: Cite DTPR
description: How to cite DTPR in research, teaching and product disclosure, and the works DTPR cites in turn.
---

DTPR is a public taxonomy and disclosure standard. If you reference it, in a paper, a course, a regulatory filing, a privacy notice or a product disclosure, please cite it. The citation below is canonical; we keep it in sync with the [`CITATION.cff`](https://github.com/Helpful-Places/dtpr/blob/main/CITATION.cff) file at the repository root, which GitHub renders as the **Cite this repository** sidebar button.

## Citation

Helpful Places. (2026). *DTPR: Digital Trust for Places & Routines* (Version 0.1.0) [Computer software]. https://dtpr.io

```bibtex
@misc{dtpr-2026,
  title        = {DTPR: Digital Trust for Places \& Routines},
  author       = {{Helpful Places}},
  year         = {2026},
  version      = {0.1.0},
  url          = {https://dtpr.io},
  howpublished = {\url{https://github.com/Helpful-Places/dtpr}},
  note         = {Licensed CC-BY-4.0}
}
```

Download the BibTeX as a file: [dtpr.bib](/dtpr.bib).

## Citing a specific category or element

When you cite a single element (for example `input_decision`) or a single category (for example `risks_mitigation`) rather than the standard as a whole, point at the element's permalink in the taxonomy explorer and quote the schema version it came from:

```
DTPR, element input_decision (schema dtpr@2026-09-01-beta). https://dtpr.io/taxonomy/elements/input_decision
```

The schema version is shown on every element page in the [taxonomy](/taxonomy) and on every datachain via its `schema_version` field.

## Works DTPR cites

Where the standard adapts content from external research, the source carries its own citation and licence below. Per-element provenance lives in each category's and element's `sources[]` array, readable through the MCP [`get_element`](/docs/developers/mcp-server/tools/get-element) tool or the REST [element detail](/docs/developers/rest-api/element-detail) endpoint. This page is the human-readable summary.

### AIAAIC harms taxonomy

The Risks & Mitigation category (`risks_mitigation`) adapts the AIAAIC harms taxonomy. Distributing modifications to those elements requires CC BY-SA 4.0. See the [Attribution](/docs/attribution) page for the full ShareAlike scope.

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

## Licence

DTPR is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/), with the `risks_mitigation` elements inheriting CC BY-SA 4.0 from AIAAIC. See the [Attribution](/docs/attribution) page for the full licence summary and per-surface breakdown.
