import type { Category } from '@dtpr/api/schema'

// Pinned subset of categories under the 'ai' datachain-type for the
// 2026-04-16-beta schema. Sufficient to exercise all presentation
// behaviors (grouped elements, ordering, accordion). Shape tracks
// api/src/schema/category.ts.
export const CATEGORIES_SAMPLE: readonly Category[] = [
  {
    id: 'purpose',
    datachain_type: 'ai',
    order: 0,
    required: false,
    name: [{ locale: 'en', value: 'Purpose' }],
    description: [{ locale: 'en', value: 'What the algorithm is for.' }],
    prompt: [],
    element_variables: [],
  },
  {
    id: 'data',
    datachain_type: 'ai',
    order: 1,
    required: false,
    name: [{ locale: 'en', value: 'Data' }],
    description: [{ locale: 'en', value: 'What data is used.' }],
    prompt: [],
    element_variables: [],
  },
  {
    id: 'accountability',
    datachain_type: 'ai',
    order: 2,
    required: false,
    name: [{ locale: 'en', value: 'Accountability' }],
    description: [{ locale: 'en', value: 'Who is accountable.' }],
    prompt: [],
    element_variables: [],
  },
]
