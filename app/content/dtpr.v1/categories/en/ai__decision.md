---
id: ai__decision
name: Decision Type
description: The type of decision being made by the AI system.
prompt: What is the type of decision being made by this AI system?
required: true
order: 3
datachain_type: ai
element_variables:
  - id: additional_description
    label: Description
context:
  id: level_of_autonomy
  name: Level of Autonomy
  description: Indicates the degree of human involvement in the AI decision process.
  values:
    - id: ai_only
      name: AI decides and executes
      description: AI processes, decides, and executes without human involvement.
      color: "#F28C28"
    - id: ai_decides_human_executes
      name: AI decides, human executes
      description: AI processes and generates a decision, but humans are required to execute.
      color: "#FFD700"
    - id: ai_flags_human_decides
      name: AI flags, human decides
      description: AI flags information for humans to evaluate, decide, and take action.
      color: "#4A90D9"
updated_at: 2025-08-29T00:00:00Z
---
