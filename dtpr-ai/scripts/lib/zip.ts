/**
 * Minimal in-process ZIP writer.
 *
 * Implements the ZIP file format spec (APPNOTE.TXT) — local file
 * headers, central directory, end-of-central-directory record — with
 * deflate compression (method=8). No ZIP64 (the archives here are
 * tiny). No extra fields, no comments, no encryption. CRC32 comes from
 * Node's built-in `zlib.crc32` (Node 22+).
 *
 * Why hand-rolled: an `archiver` dependency triggers `pnpm install`
 * lockfile churn that upgrades unrelated transitive packages, and a
 * `zip` shell-out fails on minimal CI containers (Cloudflare Workers
 * Builds) that don't ship Info-ZIP.
 *
 * Shared by `build-skills.ts` (Claude plugin skill bundles) and
 * `build-figma-plugin.ts` (the Figma plugin download).
 */

import { crc32, deflateRawSync } from 'node:zlib'

/**
 * One archive member. `name` uses forward slashes; a trailing `/`
 * denotes a directory entry (zero-length data).
 */
export interface ZipEntry {
  name: string
  data: Buffer
}

function dosTime(date: Date): { time: number; date: number } {
  // DOS time: bits 0-4 = seconds/2, 5-10 = minute, 11-15 = hour
  // DOS date: bits 0-4 = day, 5-8 = month, 9-15 = year - 1980
  const time =
    (Math.floor(date.getSeconds() / 2) & 0x1f) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getHours() & 0x1f) << 11)
  const dateField =
    (date.getDate() & 0x1f) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (((date.getFullYear() - 1980) & 0x7f) << 9)
  return { time, date: dateField }
}

/**
 * Build a ZIP archive from `entries`. Returns a Buffer suitable for
 * writing to disk with a `.zip` (or `.skill`) extension.
 */
export function buildZip(entries: ZipEntry[]): Buffer {
  const now = new Date()
  const { time: dosT, date: dosD } = dosTime(now)
  const chunks: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, 'utf8')
    const isDir = entry.name.endsWith('/')
    const uncompressed = entry.data
    const uncompSize = uncompressed.length
    const crc = uncompSize === 0 ? 0 : crc32(uncompressed)
    // Directory entries: store empty. File entries: deflate.
    const compressed = isDir || uncompSize === 0 ? Buffer.alloc(0) : deflateRawSync(uncompressed, { level: 9 })
    const compSize = compressed.length
    const method = isDir || uncompSize === 0 ? 0 : 8

    // Local file header (30 bytes + name).
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0) // signature
    localHeader.writeUInt16LE(20, 4)          // version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6)      // general purpose: UTF-8 filename
    localHeader.writeUInt16LE(method, 8)      // compression method
    localHeader.writeUInt16LE(dosT, 10)
    localHeader.writeUInt16LE(dosD, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(compSize, 18)
    localHeader.writeUInt32LE(uncompSize, 22)
    localHeader.writeUInt16LE(nameBytes.length, 26)
    localHeader.writeUInt16LE(0, 28)          // extra field length
    chunks.push(localHeader, nameBytes, compressed)

    // Central directory entry (46 bytes + name).
    const centralEntry = Buffer.alloc(46)
    centralEntry.writeUInt32LE(0x02014b50, 0) // signature
    centralEntry.writeUInt16LE(20, 4)          // version made by (2.0, Unix)
    centralEntry.writeUInt16LE(20, 6)          // version needed
    centralEntry.writeUInt16LE(0x0800, 8)      // general purpose: UTF-8 filename
    centralEntry.writeUInt16LE(method, 10)
    centralEntry.writeUInt16LE(dosT, 12)
    centralEntry.writeUInt16LE(dosD, 14)
    centralEntry.writeUInt32LE(crc, 16)
    centralEntry.writeUInt32LE(compSize, 20)
    centralEntry.writeUInt32LE(uncompSize, 24)
    centralEntry.writeUInt16LE(nameBytes.length, 28)
    centralEntry.writeUInt16LE(0, 30)          // extra field
    centralEntry.writeUInt16LE(0, 32)          // comment
    centralEntry.writeUInt16LE(0, 34)          // disk number start
    centralEntry.writeUInt16LE(0, 36)          // internal attrs
    centralEntry.writeUInt32LE(isDir ? 0x10 : 0, 38) // external attrs (dir flag)
    centralEntry.writeUInt32LE(offset, 42)     // relative offset of local header
    central.push(centralEntry, nameBytes)

    offset += localHeader.length + nameBytes.length + compressed.length
  }

  const centralBuf = Buffer.concat(central)
  const centralOffset = offset
  const centralSize = centralBuf.length

  // End of central directory record (22 bytes).
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)     // signature
  eocd.writeUInt16LE(0, 4)               // disk number
  eocd.writeUInt16LE(0, 6)               // disk where central starts
  eocd.writeUInt16LE(entries.length, 8)  // records on this disk
  eocd.writeUInt16LE(entries.length, 10) // total records
  eocd.writeUInt32LE(centralSize, 12)
  eocd.writeUInt32LE(centralOffset, 16)
  eocd.writeUInt16LE(0, 20)              // comment length

  return Buffer.concat([...chunks, centralBuf, eocd])
}
