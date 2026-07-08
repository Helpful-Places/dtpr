<script setup lang="ts">
import { DtprDatachain, DtprElement, DtprElementGrid } from '@dtpr/ui/vue'
import type { ElementDisplay } from '@dtpr/ui/vue'

// Patternizr rendered as a full DTPR datachain.
// Source: nyc.clarable.ai/algorithms/78e4e278-… (LL35 register).
// Section ids follow the `ai__<category_id>` deep-link convention.
const API = 'https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements'

function icon(id: string, alt: string) {
  return {
    url: `${API}/${id}/icon.svg`,
    urlDark: `${API}/${id}/icon.dark.svg`,
    alt,
  }
}

const sections = [
  { id: 'ai__accountable', title: 'Accountable' },
  { id: 'ai__functional_modes', title: 'Functional Modes' },
  { id: 'ai__purpose', title: 'Purpose' },
  { id: 'ai__input_dataset', title: 'Input Dataset' },
  { id: 'ai__processing', title: 'Processing' },
  { id: 'ai__output_dataset', title: 'Output Dataset' },
  { id: 'ai__risks_mitigation', title: 'Risks & Mitigation' },
  { id: 'ai__rights', title: 'Rights' },
] as const

const elements: Record<string, ElementDisplay[]> = {
  ai__accountable: [
    {
      title: 'NYPD',
      description:
        'The New York City Police Department deploys Patternizr for use by department analysts.',
      icon: icon('institution', 'Institution'),
      variables: [],
      contextValue: { id: 'deployer', name: 'Deployer', color: null },
    },
  ],
  ai__functional_modes: [
    {
      title: 'Analytical mode',
      description:
        'Analyzes crime reports to identify groups of similar incidents that may connect to a single offender or pattern.',
      icon: icon('analytical_mode', 'Analytical mode'),
      variables: [],
      contextValue: { id: 'human_decides', name: 'Human decides', color: '#2A9D8F' },
    },
  ],
  ai__purpose: [
    {
      title: 'Safety & Security',
      description:
        'Helps NYPD analysts surface patterns across cases that might otherwise go unnoticed across precinct boundaries.',
      icon: icon('safety_security', 'Safety & Security'),
      variables: [],
    },
  ],
  ai__input_dataset: [
    {
      title: 'About a person',
      description:
        'Crime report records — including location, time, method, and suspect details — drawn from NYPD case files.',
      icon: icon('input_about_a_person', 'About a person'),
      variables: [],
      contextValue: { id: 'identifiable', name: 'Identifiable', color: '#FFD700' },
    },
  ],
  ai__processing: [
    {
      title: 'Classification & Prediction',
      description:
        'Built from labeled historical data — scores how likely two reports share a pattern.',
      icon: icon('classification_prediction', 'Classification & Prediction'),
      variables: [],
    },
  ],
  ai__output_dataset: [
    {
      title: 'A recommendation or prediction',
      description:
        'Probability scores for pattern matches. Advisory output — a human analyst reviews every result before any investigative action.',
      icon: icon('output_recommendation', 'A recommendation or prediction'),
      variables: [],
      contextValue: { id: 'de_identified', name: 'Anonymous', color: '#4A90D9' },
    },
  ],
  ai__risks_mitigation: [
    {
      title: 'Civil liberties harm',
      description:
        'Risk that automated pattern-matching contributes to disproportionate surveillance or investigative attention.',
      icon: icon('civil_liberties_harm', 'Civil liberties harm'),
      variables: [],
    },
    {
      title: 'Reputational harm',
      description:
        'Risk that a person flagged in a pattern may face downstream consequences before human review concludes.',
      icon: icon('reputational_harm', 'Reputational harm'),
      variables: [],
    },
  ],
  ai__rights: [
    {
      title: 'Right to Algorithmic Transparency',
      description:
        'The system is disclosed in NYC’s Local Law 35 report; documentation of its purpose and risks is public.',
      icon: icon('right_algorithmic_transparency', 'Right to Algorithmic Transparency'),
      variables: [],
    },
    {
      title: 'Right to a Human Review',
      description:
        'Every Patternizr recommendation is reviewed by a human analyst before any investigative action.',
      icon: icon('right_to_human_review', 'Right to a Human Review'),
      variables: [],
    },
  ],
}
</script>

<template>
  <div class="datachain-test">
    <div class="datachain-test__hint">
      Rendered with <code>&lt;DtprDatachain&gt;</code> — accordion sections,
      one elements grid per category.
    </div>
    <DtprDatachain
      :sections="sections"
      title="Patternizr"
      description="A machine-learning tool used by NYPD analysts to identify groups of similar crimes that may connect to a single offender or pattern."
    >
      <template
        v-for="section in sections"
        :key="section.id"
        #[`section-${section.id}`]
      >
        <DtprElementGrid>
          <DtprElement
            v-for="(el, i) in elements[section.id] || []"
            :key="i"
            :display="el"
            :show-description="true"
          />
        </DtprElementGrid>
      </template>
    </DtprDatachain>
  </div>
</template>

<style scoped>
.datachain-test {
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  /* Slidev slides clip overflow by default; let the accordion grow and
     scroll within the slide if many sections open. */
  max-height: 80vh;
  overflow-y: auto;
}
.datachain-test__hint {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
}
.datachain-test__hint code {
  font-family: var(--dtpr-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  background: rgba(0, 0, 0, 0.06);
  padding: 0.05rem 0.35rem;
  border-radius: 0.25rem;
  text-transform: none;
}
</style>
