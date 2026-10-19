// Development support for Impeccable's live editor, which edits copy in the
// browser and writes it back to source. Nothing here runs outside `nuxt dev`.
//
// Most of the site's copy comes from content/, not from the Vue components, so
// Impeccable can't tell where an edited string lives and its Apply check
// fails. It does read a source hint from `data-astro-source-file` and
// `data-astro-source-loc` (the attributes Astro adds in dev), so this plugin
// puts those attributes on every element whose text comes from a content
// file, pointing at its file and line. server/dev/contentSources.ts builds the
// map from text to file and line.

type SourceLine = { file: string, line: number }

const FILE_ATTR = 'data-astro-source-file'
const LOC_ATTR = 'data-astro-source-loc'

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

// When the same text is in several files, the header and footer take it from
// the nav file, and the page from the file that matches its path.
function pick(hits: SourceLine[], el: Element, path: string): SourceLine {
  if (!el.closest('main')) return hits.find(hit => hit.file === 'content/navElements.yaml') ?? hits[0]!
  const segments = path.split('/').filter(Boolean)
  const score = (hit: SourceLine) => segments.filter(s => hit.file.replace(/\d+\./g, '').includes(s)).length
  return [...hits].sort((a, b) => score(b) - score(a))[0]!
}

export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return

  // Nuxt Studio's adjustFixedElements() clears `left` on every fixed element,
  // which pushes Impeccable's centered bar half off the screen.
  new MutationObserver(() => {
    const bar = document.getElementById('impeccable-live-global-bar')
    if (bar && !bar.style.left) bar.style.left = '50%'
  }).observe(document.body, { attributes: true, attributeFilter: ['style'], subtree: true })

  // The Nuxt DevTools button sits on top of that bar. Shift+Option+D still
  // opens DevTools.
  const style = document.createElement('style')
  style.textContent = 'body:has(#impeccable-live-global-bar) #nuxt-devtools-container { display: none !important; }'
  document.head.appendChild(style)

  const route = useRoute()
  const stamp = async () => {
    // Read fresh each time, so the map follows each applied edit.
    const index = await $fetch<Record<string, SourceLine[]>>('/__content-sources')
    for (const el of document.querySelectorAll<HTMLElement>('#__nuxt *')) {
      // Text being edited keeps the hint it had when editing began.
      if (el.isContentEditable) continue
      const text = normalize(el.textContent ?? '')
      const hits = index[text]
      // Only the innermost element that holds the text gets the hint.
      if (hits && ![...el.children].some(child => normalize(child.textContent ?? '') === text)) {
        const hit = pick(hits, el, route.path)
        // Only write changes, so a settled page makes no mutations to react to.
        if (el.getAttribute(FILE_ATTR) !== hit.file) el.setAttribute(FILE_ATTR, hit.file)
        if (el.getAttribute(LOC_ATTR) !== `${hit.line}:1`) el.setAttribute(LOC_ATTR, `${hit.line}:1`)
      }
      else if (el.hasAttribute(FILE_ATTR)) {
        el.removeAttribute(FILE_ATTR)
        el.removeAttribute(LOC_ATTR)
      }
    }
  }

  // Stamp again whenever the page's text changes: navigation, hot reloads and
  // content updates. Setting attributes doesn't trigger the observer.
  let timer: ReturnType<typeof setTimeout> | undefined
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => stamp().catch(() => {}), 300)
  }
  new MutationObserver(schedule).observe(document.getElementById('__nuxt') ?? document.body, { childList: true, characterData: true, subtree: true })
  schedule()
})
