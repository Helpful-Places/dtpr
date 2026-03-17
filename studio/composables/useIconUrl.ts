export function useIconUrl(path: string | undefined): string {
  if (!path) return ''
  // Icons are served from the main DTPR app
  return `https://dtpr.io${path}`
}
