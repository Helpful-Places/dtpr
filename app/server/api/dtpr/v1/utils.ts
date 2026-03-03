import { createError } from 'h3'
import type { LocaleValue, Variable, Context, ContextValue, DatachainType } from './types'
import { VALID_DATACHAIN_TYPES } from './types'

/**
 * Validates the datachain_type parameter
 * @throws 400 error if invalid
 */
export function validateDatachainType(datachain_type: any): DatachainType {
  if (!datachain_type || !VALID_DATACHAIN_TYPES.includes(datachain_type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid datachain_type. Must be "ai" or "device"'
    })
  }
  return datachain_type as DatachainType
}

/**
 * Parses locale query parameter into an array of locale strings
 */
export function parseLocalesQuery(query: any): string[] | null {
  if (!query.locales) {
    return null
  }
  
  return Array.isArray(query.locales) 
    ? query.locales 
    : query.locales.toString().split(',')
}

/**
 * Calculates the latest version from an array of timestamps
 */
export function calculateLatestVersion(timestamps: string[]): string {
  if (!timestamps || timestamps.length === 0) {
    return new Date().toISOString()
  }
  
  return timestamps.reduce((latest: string, current: string) => {
    return new Date(current) > new Date(latest) ? current : latest
  })
}

/**
 * Filters an array of LocaleValue objects by requested locales
 */
export function filterLocaleValues(values: LocaleValue[], requestedLocales: string[]): LocaleValue[] {
  if (!requestedLocales || requestedLocales.length === 0) {
    return values
  }
  return values.filter((item: LocaleValue) => requestedLocales.includes(item.locale))
}

/**
 * Processes and aggregates variables with locale-specific labels
 */
export function processVariableWithLocale(
  variable: any,
  locale: string,
  variablesMap: Map<string, Variable>
): void {
  let existingVar = variablesMap.get(variable.id)
  
  if (!existingVar) {
    existingVar = {
      id: variable.id,
      label: [],
      required: variable.required !== undefined ? variable.required : false
    }
    variablesMap.set(variable.id, existingVar)
  }
  
  // Add locale-specific label if it exists
  if (variable.label) {
    // Check if we already have this locale's label
    const hasLocale = existingVar.label.some((l: LocaleValue) => l.locale === locale)
    if (!hasLocale) {
      existingVar.label.push({
        locale,
        value: variable.label
      })
    }
  }
  
  // Update required field if this instance specifies it as true
  if (variable.required === true) {
    existingVar.required = true
  }
}

/**
 * Accumulator for building context data across locale files
 */
export interface ContextAccumulator {
  id: string
  name: LocaleValue[]
  description: LocaleValue[]
  values: Map<string, {
    id: string
    name: LocaleValue[]
    description: LocaleValue[]
    color: string
  }>
}

/**
 * Processes context data from a locale file into the accumulator
 */
export function processContextWithLocale(
  context: any,
  locale: string,
  accumulator: ContextAccumulator | null
): ContextAccumulator {
  if (!accumulator) {
    accumulator = {
      id: context.id,
      name: [],
      description: [],
      values: new Map()
    }
  }

  // Add locale-specific name and description
  const hasLocaleName = accumulator.name.some((l: LocaleValue) => l.locale === locale)
  if (!hasLocaleName && context.name) {
    accumulator.name.push({ locale, value: context.name })
  }

  const hasLocaleDesc = accumulator.description.some((l: LocaleValue) => l.locale === locale)
  if (!hasLocaleDesc && context.description) {
    accumulator.description.push({ locale, value: context.description })
  }

  // Process each context value
  if (context.values) {
    context.values.forEach((val: any) => {
      let existing = accumulator!.values.get(val.id)
      if (!existing) {
        existing = {
          id: val.id,
          name: [],
          description: [],
          color: val.color
        }
        accumulator!.values.set(val.id, existing)
      }

      const hasValName = existing.name.some((l: LocaleValue) => l.locale === locale)
      if (!hasValName && val.name) {
        existing.name.push({ locale, value: val.name })
      }

      const hasValDesc = existing.description.some((l: LocaleValue) => l.locale === locale)
      if (!hasValDesc && val.description) {
        existing.description.push({ locale, value: val.description })
      }
    })
  }

  return accumulator
}

/**
 * Converts a context accumulator to the final Context object
 */
export function finalizeContext(accumulator: ContextAccumulator): Context {
  return {
    id: accumulator.id,
    name: accumulator.name,
    description: accumulator.description,
    values: Array.from(accumulator.values.values())
  }
}

/**
 * Filters locale arrays within a Context object by requested locales
 */
export function filterContextByLocale(context: Context, requestedLocales: string[]): Context {
  return {
    id: context.id,
    name: filterLocaleValues(context.name, requestedLocales),
    description: filterLocaleValues(context.description, requestedLocales),
    values: context.values.map((val: ContextValue) => ({
      ...val,
      name: filterLocaleValues(val.name, requestedLocales),
      description: filterLocaleValues(val.description, requestedLocales)
    }))
  }
}

/**
 * Filters variables by requested locales
 */
export function filterVariablesByLocale(variables: Variable[], requestedLocales: string[]): Variable[] {
  if (!requestedLocales || requestedLocales.length === 0) {
    return variables
  }
  
  return variables.map((variable: Variable) => ({
    ...variable,
    label: filterLocaleValues(variable.label, requestedLocales)
  }))
}