// The August 2026 staff questionnaire at a small cultural organization in
// Canada, 18 responses, coded to 0-100 scales. Rows are anonymized: ids are
// row order and nothing more; a null means the respondent skipped the
// question or answered "hard to say". No names, no free text. The
// organization is not named anywhere in this deck.
//
// Coding:
//   confidence  sometimes 50 · mostly / "between" 75 · always 100
//   comfort     no 0 · probably not 25 · qualified yes 75 · yes 100

export const CONFIDENCE = {
  label: 'Trust in own use',
  question: 'When you use AI at work, how confident are you that you’re using it appropriately?',
  anchors: ['Not confident', 'Rarely sure', 'Sometimes sure', 'Mostly sure', 'Always sure'],
  values: [100, 50, 100, 100, 100, 100, 100, 50, 75, 100, 75, 50, 50, 50, 50],
}

export const COMFORT = {
  label: 'Comfort disclosing',
  question: 'Would you feel comfortable telling a colleague or your manager that you used AI on a piece of work?',
  anchors: ['Would hide it', 'Probably not', 'It depends', 'Probably', 'Openly yes'],
  values: [100, 25, 75, 100, 100, 100, 75, 100, 100, 75, 100, 25, 100, 100, 100],
}

export const RESPONDENTS = 18
export const NON_USERS = 3

export const CONCERNS = [
  { key: 'voice', label: 'Losing the human voice in our communications', n: 14 },
  { key: 'accuracy', label: 'Accuracy of what it produces', n: 12 },
  { key: 'environment', label: 'Environmental impact', n: 12 },
  { key: 'privacy', label: 'Privacy & confidentiality of what we put in', n: 11 },
  { key: 'reaction', label: 'How partners, funders or the public would react', n: 9 },
  { key: 'jobs', label: 'Effects on jobs or roles', n: 6 },
]

// Three of the questions staff want an AI policy to answer (paraphrased
// client-build copy). The disclosure question is last on purpose.
export const POLICY_QUESTIONS = [
  'Which uses of AI are acceptable, and which tools can staff use?',
  'What information can staff safely share with AI tools?',
  'Do we tell partners and funders when AI helped with a piece of work?',
]
