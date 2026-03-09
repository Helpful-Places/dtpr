// Shared types for DTPR API endpoints

export interface LocaleValue {
  locale: string
  value: string
}

export interface Variable {
  id: string
  label: LocaleValue[]
  required: boolean
}

export interface ContextValue {
  id: string
  name: LocaleValue[]
  description: LocaleValue[]
  color: string
}

export interface Context {
  id: string
  name: LocaleValue[]
  description: LocaleValue[]
  values: ContextValue[]
}

export interface SchemaMetadata {
  name: string
  id: string
  version: string
  namespace: string
}

export type DatachainType = 'ai' | 'device'

export const VALID_DATACHAIN_TYPES: DatachainType[] = ['ai', 'device']