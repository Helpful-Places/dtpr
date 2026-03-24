// Types for the draft-2026-03 experimental taxonomy API

export type LocaleMap = Record<string, string>

export interface ElementVariable {
  id: string
  label?: LocaleMap
  required?: boolean
  type?: 'text' | 'select' | 'multiselect'
}

export interface ContextValue {
  id: string
  name: LocaleMap
  description: LocaleMap
  color: string
}

export interface Context {
  id: string
  name: LocaleMap
  description: LocaleMap
  values: ContextValue[]
}

export interface DatachainCategory {
  id: string
  name: LocaleMap
  description: LocaleMap
  prompt: LocaleMap
  required?: boolean
  order?: number
  element_variables?: ElementVariable[]
  context?: Context
  version: string
}

export interface Element {
  id: string
  category: string[]
  name: LocaleMap
  description: LocaleMap
  icon: string
  symbol?: string
  version: string
}

// Reuse SchemaMetadata from v1
export type { SchemaMetadata } from '../v1/types'
