import plugin from '../../../../plugin/dtpr/.claude-plugin/plugin.json'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const redirect = resolveLegacyRedirect({
    host: getRequestHost(event),
    path: url.pathname,
    search: url.search,
    method: event.method,
    accept: getRequestHeader(event, 'accept') ?? '',
    skillsVersion: plugin.version,
  })
  if (!redirect) return

  if (redirect.cors) {
    setResponseHeader(event, 'access-control-allow-origin', '*')
    // A preflight can't follow a redirect, so answer it here and redirect
    // the real request.
    if (event.method === 'OPTIONS') {
      setResponseHeaders(event, {
        'access-control-allow-methods': 'GET, HEAD, POST, OPTIONS',
        'access-control-allow-headers': getRequestHeader(event, 'access-control-request-headers') ?? '*',
      })
      return sendNoContent(event)
    }
  }
  return sendRedirect(event, redirect.location, redirect.status)
})
