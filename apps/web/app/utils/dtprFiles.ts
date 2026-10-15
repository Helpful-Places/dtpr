import { gunzipSync, gzipSync, strFromU8, strToU8, zipSync } from 'fflate'

// Browser-side file helpers for icon downloads, the datachain package and share links.

export function dtprSaveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function dtprFetchSvg(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Icon request failed (${res.status})`)
  return res.text()
}

/** Rasterise an SVG to a square PNG. The API's icons are 36px, so they are scaled up. */
export async function dtprSvgToPng(svg: string, size = 512): Promise<Uint8Array> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('Could not render the icon'))
      img.src = url
    })
    const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size })
    canvas.getContext('2d')!.drawImage(img, 0, 0, size, size)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render the icon'))), 'image/png'))
    return new Uint8Array(await blob.arrayBuffer())
  }
  finally {
    URL.revokeObjectURL(url)
  }
}

export function dtprZip(files: Record<string, string | Uint8Array>): Blob {
  const entries = Object.fromEntries(Object.entries(files).map(([name, data]) => [name, typeof data === 'string' ? strToU8(data) : data]))
  return new Blob([zipSync(entries) as BlobPart], { type: 'application/zip' })
}

/** Run `task` over `items`, a few at a time, so icon downloads stay inside the API's rate limit. */
export async function dtprEach<T>(items: T[], task: (item: T) => Promise<void>, concurrency = 8) {
  const queue = [...items]
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) await task(queue.shift()!)
  }))
}

/** SVG and PNG, light and dark, for each element, as zip entries under `folder`. */
export async function dtprIconFiles(
  version: string,
  items: { element: DtprElement, contextValueId?: string | null }[],
  folder = 'icons',
): Promise<Record<string, Uint8Array | string>> {
  const files: Record<string, Uint8Array | string> = {}
  const jobs = items.flatMap((item) => [false, true].map((dark) => ({ ...item, dark })))
  await dtprEach(jobs, async ({ element, contextValueId, dark }) => {
    const svg = await dtprFetchSvg(dtprIconUrl(version, element.id, dtprIconVariant(element, contextValueId, dark)))
    const name = `${folder}/${element.id}${dark ? '.dark' : ''}`
    files[`${name}.svg`] = svg
    files[`${name}.png`] = await dtprSvgToPng(svg)
  })
  return files
}

// Share links carry the datachain in the URL fragment as base64url(gzip(json)),
// the same encoding the earlier dtpr.ai visualizer used.
export function dtprEncodeShare(chain: unknown): string {
  const bytes = gzipSync(strToU8(JSON.stringify(chain)))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function dtprDecodeShare(hash: string): unknown | null {
  const raw = new URLSearchParams(hash.replace(/^#/, '')).get('data')
  if (!raw) return null
  const bin = atob(raw.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return JSON.parse(strFromU8(gunzipSync(bytes)))
}
