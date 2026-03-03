---
id: ai__decision
name: Uri ng Desisyon
datachain_type: ai
element_variables:
  - id: additional_description
    label: Paglalarawan
required: true
order: 3
description: Ang uri ng desisyon na ginagawa ng AI system.
prompt: Ano ang uri ng desisyon na ginagawa ng AI system na ito?
context:
  id: level_of_autonomy
  name: Antas ng Awtonomiya
  description: Ipinapahiwatig ang antas ng paglahok ng tao sa proseso ng desisyon ng AI.
  values:
    - id: ai_only
      name: Ang AI ang nagpapasya at nagpapatupad
      description: Ang AI ang nagpoproseso, nagpapasya, at nagpapatupad nang walang paglahok ng tao.
      color: "#F28C28"
    - id: ai_decides_human_executes
      name: Ang AI ang nagpapasya, ang tao ang nagpapatupad
      description: Ang AI ang nagpoproseso at bumubuo ng desisyon, ngunit kailangan ng mga tao para ipatupad.
      color: "#FFD700"
    - id: ai_flags_human_decides
      name: Ang AI ang nagba-flag, ang tao ang nagpapasya
      description: Ang AI ang nagba-flag ng impormasyon para sa mga tao na suriin, magpasya, at kumilos.
      color: "#4A90D9"
updated_at: 2025-08-29T00:00:00Z
---

