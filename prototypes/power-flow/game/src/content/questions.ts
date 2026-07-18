import type { QuestionId, SystemCardId } from './types';
import type { CategoryKey } from './system';

export interface QuestionDef {
  id: QuestionId;
  q: string;
  cat: CategoryKey;
  /** the system card it aims at; 'board' = the whole board (the affected prompt) */
  target: SystemCardId | 'board';
  targetLabel: string;
  note: string;
}

export const QUESTION_ORDER: QuestionId[] = [
  'whoCanSee', 'howLong', 'whereLives', 'decidesAlone', 'whenWrong',
  'canISayNo', 'whoProfits', 'whatElse', 'usedOn',
];

export const QUESTION_DEFS: Record<QuestionId, QuestionDef> = {
  whoCanSee: {
    id: 'whoCanSee', q: 'Who can see it?', cat: 'access', target: 'sees', targetLabel: 'Who Sees It',
    note: 'The schema’s own prompt. Aim at the access card.',
  },
  howLong: {
    id: 'howLong', q: 'How long do you keep me?', cat: 'retention', target: 'long', targetLabel: 'How Long',
    note: 'Retention is where breaches go to grow.',
  },
  whereLives: {
    id: 'whereLives', q: 'Where does it live?', cat: 'storage', target: 'lives', targetLabel: 'Where It Lives',
    note: 'Whose building, whose jurisdiction, whose subpoena.',
  },
  decidesAlone: {
    id: 'decidesAlone', q: 'Does it decide alone?', cat: 'functional_modes', target: 'model', targetLabel: 'The Model',
    note: 'Aim at the autonomy dial.',
  },
  whenWrong: {
    id: 'whenWrong', q: 'What happens when it’s wrong?', cat: 'risks_mitigation', target: 'error', targetLabel: 'The Error Rate / recourse',
    note: 'If the target is sealed: “we don’t know” is a legal answer. It costs Legitimacy −1.',
  },
  canISayNo: {
    id: 'canISayNo', q: 'Can I say no?', cat: 'rights', target: 'reads', targetLabel: 'What It Reads',
    note: 'Is there a lane that doesn’t read you? (right_object)',
  },
  whoProfits: {
    id: 'whoProfits', q: 'Who profits?', cat: 'accountable', target: 'fineprint', targetLabel: 'The Fine Print',
    note: 'Follow the data clause, not the press release.',
  },
  whatElse: {
    id: 'whatElse', q: 'What else could it do?', cat: 'purpose', target: 'pitch', targetLabel: 'The Pitch',
    note: 'Purpose limitation. Pre-empts the vendor’s “free upgrade.” (right_purpose_limitation)',
  },
  usedOn: {
    id: 'usedOn', q: 'Who is it used on?', cat: 'affected', target: 'board', targetLabel: 'the whole board',
    note: 'The schema’s prompt for the new affected category. Answering grants the community one free Context reveal.',
  },
};
