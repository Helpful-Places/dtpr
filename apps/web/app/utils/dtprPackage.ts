// The download package: everything needed to put a datachain on a sign or into
// another project, built in the browser.

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

interface PackageInput {
  taxonomy: DtprTaxonomy
  chain: DtprDatachain
  resolved: unknown
  locale: string
}

/** A self-contained, printable one-page summary with the icons inlined. */
function summaryHtml({ taxonomy, chain, locale }: PackageInput, svgs: Map<string, string>): string {
  const elements = new Map(taxonomy.elements.map((e) => [e.id, e]))
  const name = escapeHtml(dtprText(chain.title, locale) || 'Untitled datachain')

  const sections = taxonomy.categories.map((category) => {
    const placed = chain.elements.filter((p) => elements.get(p.element_id)?.category_id === category.id)
    if (!placed.length) return ''
    const rows = placed.map((p) => {
      const element = elements.get(p.element_id)!
      const values = dtprVariableValues(p, locale)
      const contextValue = category.element_context?.values.find((v) => v.id === p.context_type_id)
      // Variables that are not blanks in the title or description are shown as extra lines.
      const inText = `${dtprText(element.title, locale)} ${dtprText(element.description, locale)}`
      const extras = element.variables
        .filter((v) => v.id !== 'title' && values[v.id] && !inText.includes(`{{${v.id}}}`))
        .map((v) => `<p class="extra">${escapeHtml(values[v.id]!)}</p>`).join('')
      return `<div class="element">
        <div class="icon">${svgs.get(p.element_id) ?? ''}</div>
        <div>
          <h3>${escapeHtml(values.title ? `${values.title} (${dtprFill(dtprText(element.title, locale), values)})` : dtprFill(dtprText(element.title, locale), values))}${contextValue ? ` <span class="tag">${escapeHtml(dtprText(contextValue.name, locale))}</span>` : ''}</h3>
          <p>${escapeHtml(dtprFill(dtprText(element.description, locale), values))}</p>
          ${extras}
        </div>
      </div>`
    }).join('')
    return `<section><h2>${escapeHtml(dtprText(category.name, locale))}</h2>${rows}</section>`
  }).join('')

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name}</title>
<style>
  body { font: 15px/1.45 system-ui, sans-serif; color: #0f172a; max-width: 46rem; margin: 2rem auto; padding: 0 1.25rem; }
  h1 { font-size: 1.75rem; margin: 0 0 .25rem; }
  .meta { color: #475569; font-size: .8rem; margin: 0 0 1.5rem; }
  section { break-inside: avoid; margin-bottom: 1.25rem; }
  h2 { font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; color: #1b2b80; border-top: 2px solid #1b2b80; padding-top: .4rem; margin: 0 0 .6rem; }
  .element { display: flex; gap: .85rem; margin-bottom: .75rem; break-inside: avoid; }
  .icon { flex: none; width: 48px; height: 48px; }
  .icon svg { width: 100%; height: 100%; }
  h3 { font-size: 1rem; margin: 0; }
  p { margin: .15rem 0 0; color: #475569; }
  p.extra { color: #0f172a; }
  .tag { font-size: .7rem; font-weight: 400; border: 1px solid #cbd5e1; border-radius: 99px; padding: .05rem .5rem; vertical-align: middle; }
  footer { margin-top: 2rem; font-size: .75rem; color: #475569; border-top: 1px solid #e2e8f0; padding-top: .75rem; }
  @media print { body { margin: 0 auto; } }
</style>
</head>
<body>
<h1>${name}</h1>
<p class="meta">Described with DTPR, schema version ${escapeHtml(chain.schema_version)}</p>
${sections}
<footer>Icons and taxonomy text from DTPR (Digital Trust for Places and Routines), dtpr.io, licensed CC BY 4.0.</footer>
</body>
</html>
`
}

function readme({ taxonomy, chain, locale }: PackageInput): string {
  const name = dtprText(chain.title, locale) || 'Untitled datachain'
  const translation = taxonomy.translations.find((l) => l.locale === locale)
  const status = translation ? dtprTranslationStatusLabel(translation.status).toLowerCase() : 'not reported'
  return `${name}
${'='.repeat(name.length)}

A DTPR datachain package, made with the builder at dtpr.io/taxonomy/builder.

Schema version: ${chain.schema_version}
Language:       ${locale}
Created:        ${new Date().toISOString().slice(0, 10)}

Contents
--------
datachain.json            The datachain. This is the file to keep and edit.
datachain.resolved.json   The datachain bundled with the categories and elements
                          it refers to, so it can be displayed without another
                          request to the DTPR API.
icons/                    One icon per element, as SVG and as 512px PNG.
                          Files ending in .dark are for dark backgrounds.
summary.html              A one-page summary. Open it in a browser and print it.

Using the icons
---------------
Keep each icon whole: the outline shape and any fill colour carry meaning.
Use the .dark files on dark backgrounds instead of inverting the others.
${locale === DTPR_SOURCE_LOCALE ? '' : `
Translation
-----------
The taxonomy text in this package is in "${locale}".
Review status when this package was made: ${status}.${translation?.summary ? `\n${translation.summary}` : ''}
${dtprNeedsReview(translation?.status) ? 'Have a fluent speaker read the text before printing signage.\n' : ''}Current status and open questions: dtpr.io/taxonomy/translations
`}
Licence and attribution
-----------------------
The DTPR taxonomy and icons are licensed under CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/). When you use them, credit:

  DTPR (Digital Trust for Places and Routines), dtpr.io,
  stewarded by Helpful Places.

The descriptions you wrote yourself in this datachain are yours.
`
}

export async function dtprBuildPackage(input: PackageInput): Promise<Blob> {
  const { taxonomy, chain } = input
  const elements = new Map(taxonomy.elements.map((e) => [e.id, e]))
  const items = chain.elements
    .filter((p) => elements.has(p.element_id))
    .map((p) => ({ element: elements.get(p.element_id)!, contextValueId: p.context_type_id }))

  const files = await dtprIconFiles(chain.schema_version, items)
  const svgs = new Map(items.map(({ element }) => [element.id, files[`icons/${element.id}.svg`] as string]))

  return dtprZip({
    ...files,
    'datachain.json': JSON.stringify(chain, null, 2),
    'datachain.resolved.json': JSON.stringify(input.resolved, null, 2),
    'summary.html': summaryHtml(input, svgs),
    'README.txt': readme(input),
  })
}
