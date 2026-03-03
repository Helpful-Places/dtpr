---
id: ai__decision
name: Type de décision
datachain_type: ai
element_variables:
  - id: additional_description
    label: Description
required: true
order: 3
description: Le type de décision prise par le système d’IA.
prompt: Quel est le type de décision prise par ce système d’IA ?
context:
  id: level_of_autonomy
  name: Niveau d'autonomie
  description: Indique le degré d'implication humaine dans le processus de décision de l'IA.
  values:
    - id: ai_only
      name: L'IA décide et exécute
      description: L'IA traite, décide et exécute sans intervention humaine.
      color: "#F28C28"
    - id: ai_decides_human_executes
      name: L'IA décide, l'humain exécute
      description: L'IA traite et génère une décision, mais les humains doivent l'exécuter.
      color: "#FFD700"
    - id: ai_flags_human_decides
      name: L'IA signale, l'humain décide
      description: L'IA signale des informations pour que les humains évaluent, décident et agissent.
      color: "#4A90D9"
updated_at: 2025-08-29T00:00:00Z
---

