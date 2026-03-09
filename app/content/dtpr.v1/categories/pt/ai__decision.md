---
id: ai__decision
name: Tipo de decisão
datachain_type: ai
element_variables:
  - id: additional_description
    label: Descrição
required: true
order: 3
description: O tipo de decisão tomada pelo sistema de IA.
prompt: Que tipo de decisão está sendo tomada por este sistema de IA?
context:
  id: level_of_autonomy
  name: Nível de autonomia
  description: Indica o grau de envolvimento humano no processo de decisão da IA.
  values:
    - id: ai_only
      name: A IA decide e executa
      description: A IA processa, decide e executa sem envolvimento humano.
      color: "#F28C28"
    - id: ai_decides_human_executes
      name: A IA decide, o humano executa
      description: A IA processa e gera uma decisão, mas os humanos são necessários para executar.
      color: "#FFD700"
    - id: ai_flags_human_decides
      name: A IA sinaliza, o humano decide
      description: A IA sinaliza informações para os humanos avaliarem, decidirem e agirem.
      color: "#4A90D9"
updated_at: 2025-08-29T00:00:00Z
---

