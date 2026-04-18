export default defineEventHandler((event) => {
  const host = getRequestHeader(event, 'host')
  if (host === 'www.dtpr.ai') {
    return sendRedirect(event, `https://dtpr.ai${event.path}`, 301)
  }
})
