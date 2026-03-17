import type { ElementSummary, CategorySummary, GapReport } from '~/lib/types'

export function useElements(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return useFetch<ElementSummary[]>(`/api/elements${query}`)
}

export function useElement(id: string) {
  return useFetch(`/api/elements/${id}`)
}

export function useCategories(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return useFetch<CategorySummary[]>(`/api/categories${query}`)
}

export function useCategory(id: string) {
  return useFetch(`/api/categories/${id}`)
}

export function useGaps() {
  return useFetch<GapReport>('/api/gaps')
}

export function useIcons() {
  return useFetch('/api/icons')
}
