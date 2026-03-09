---
id: ai__decision
name: Tipo de decisión
datachain_type: ai
element_variables:
  - id: additional_description
    label: Descripción
required: true
order: 3
description: El tipo de decisión que toma el sistema de IA.
prompt: ¿Qué tipo de decisión toma este sistema de IA?
context:
  id: level_of_autonomy
  name: Nivel de autonomía
  description: Indica el grado de participación humana en el proceso de decisión de la IA.
  values:
    - id: ai_only
      name: La IA decide y ejecuta
      description: La IA procesa, decide y ejecuta sin participación humana.
      color: "#F28C28"
    - id: ai_decides_human_executes
      name: La IA decide, el humano ejecuta
      description: La IA procesa y genera una decisión, pero los humanos deben ejecutarla.
      color: "#FFD700"
    - id: ai_flags_human_decides
      name: La IA señala, el humano decide
      description: La IA señala información para que los humanos evalúen, decidan y actúen.
      color: "#4A90D9"
updated_at: 2025-08-29T00:00:00Z
---

