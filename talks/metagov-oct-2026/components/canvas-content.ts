// Content for <DtprCanvas>. Two records: the fictional face-matching fare
// gates (a composite, used on the rights slide) and one real staff use case
// from the August 2026 questionnaire at a small cultural organization in
// Canada, 18 staff. The use case carries only the paraphrased client-build
// copy from that deliverable, never a verbatim staff quote, and names
// neither the organization nor anyone in it.

export interface CanvasContent {
  ref: string
  name: string
  read: string
  purpose: { id: string, label: string }
  runby: { zone: string, el: string, name: string, role: string, note?: string }
  builtby: { zone: string, el: string, name: string, role: string, note?: string }
  modes: string[]
  sentence: { lead: string, marker: string, tail: string }
  autonomy: { label: string, color: string }
  flow: Array<{ el: string, instance: string, type: string, facts?: string[], pii?: boolean }>
  risks: Array<{ harm: string, title: string, narrative: string, mitigation: string | null }>
  affected: { who: string, rel: string, scale: string }
  rights: Array<{ id: string, title: string, sub?: string, act?: string }>
  escalate?: { label: string, act: string }
}

export const AUTONOMY = {
  human_decides: { label: 'Human decides', color: '#2A9D8F' },
  human_oversees: { label: 'Human oversees', color: '#6A1B7A' },
  autonomous: { label: 'Autonomous', color: '#E76F51' },
}

export const FARE_GATES: CanvasContent = {
  ref: 'MT-FG-104 · composite',
  name: 'Face-matching fare gates',
  read: 'Metro Transit runs face-matching gates that decide on their own who may pass. Used on every rider; riders can opt out and ask for a human review.',
  purpose: { id: 'entry', label: 'Entry' },
  runby: { zone: 'Run by', el: 'institution', name: 'Metro Transit', role: 'Deployer' },
  builtby: { zone: 'Built by', el: 'organization', name: 'FaceGate Inc.', role: 'Vendor' },
  modes: ['senses', 'decides'],
  sentence: { lead: 'The system senses and decides', marker: 'on its own', tail: '.' },
  autonomy: AUTONOMY.autonomous,
  flow: [
    { el: 'input_biometric', instance: 'your face', type: 'Biometric', facts: ['kept for 24 h', 'on a vendor cloud'], pii: true },
    { el: 'biometric_recognition', instance: 'face match', type: 'Biometric Recognition' },
    { el: 'output_decision', instance: 'match / no-match', type: 'A decision about you', facts: ['shared with transit police'], pii: true },
  ],
  risks: [
    { harm: 'civil_liberties_harm', title: 'Civil liberties harm', narrative: 'A misidentification can stop the wrong person at the gate.', mitigation: 'Human review on request' },
  ],
  affected: { who: 'All riders', rel: 'Decided about', scale: '~2.3M people a day' },
  rights: [
    { id: 'right_object', title: 'Right to Stop Processing', sub: 'opt out, tap a card instead', act: 'Get a fare card' },
    { id: 'right_contest', title: 'Right to Contest', sub: 'challenge a match', act: 'Start an appeal' },
    { id: 'right_to_human_review', title: 'Right to a Human Review', act: 'Email the review desk' },
  ],
  escalate: { label: 'If that fails: independent oversight', act: 'Email the Transit Ombudsman' },
}

export const DRAFTING_WRITING: CanvasContent = {
  ref: 'Use case 1 · 8 of 18 staff',
  name: 'Drafting & editing writing',
  read: 'Staff use chatbots to help write and edit emails, copy and reports. Some described writing a first draft themselves, asking AI to improve it, then editing the result to sound like them.',
  purpose: { id: 'inform', label: 'Communications' },
  runby: { zone: 'Used at', el: 'institution', name: 'The organization', role: 'No formal AI guidance yet', note: 'staff decide how to use these tools' },
  builtby: { zone: 'The tools', el: 'organization', name: 'ChatGPT · Claude · Copilot', role: 'The tools staff named', note: 'vendors the organization has not vetted' },
  modes: ['creates'],
  sentence: { lead: 'The tool creates text;', marker: 'a person decides', tail: ' what to keep.' },
  autonomy: AUTONOMY.human_decides,
  flow: [
    { el: 'input_sensitive_personal', instance: 'a rough draft that may name partners or funders', type: 'Sensitive personal information', facts: ['pasted into a vendor chatbot', 'no rule yet on what is safe to share'], pii: true },
    { el: 'language_models', instance: 'rephrase, tighten, adjust tone', type: 'Language Models' },
    { el: 'output_generated_content', instance: 'a polished draft', type: 'Generated content', facts: ['reviewed by staff before sharing'], pii: true },
  ],
  risks: [
    { harm: 'societal_cultural_harm', title: 'Losing the human voice', narrative: 'The most common concern in the survey. Responses raised the quality of AI writing and keeping a distinct organizational voice.', mitigation: 'Some staff described editing AI suggestions to keep their own tone and wording.' },
    { harm: 'civil_liberties_harm', title: 'Privacy & confidentiality', narrative: 'Drafts may contain partner or funder details. Staff want guidance on what information they can share with AI tools.', mitigation: null },
    { harm: 'environmental_harm', title: 'Environmental cost', narrative: 'Several staff ranked environmental impact as their main concern. Some avoid AI because they feel its use conflicts with the organization’s sustainability work.', mitigation: 'Proposed by staff: count AI use in the environmental impact reports, like commuting and guest travel.' },
  ],
  affected: { who: 'Partners, funders & the public who read the organization’s communications', rel: 'Community', scale: 'emails, captions and reports written with AI assistance' },
  rights: [
    { id: 'right_to_human_review', title: 'A person signs off', sub: 'staff review the writing before sending it' },
    { id: 'right_to_notice', title: 'Ask how it was made', sub: 'colleagues and partners can always ask if AI was used' },
  ],
}
