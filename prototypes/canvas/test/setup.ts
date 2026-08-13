// Node 25 ships a ghost `globalThis.localStorage` that overrides the one
// jsdom would install; without the `--localstorage-file` flag it has no
// Storage methods. Replace `window.localStorage` with an in-memory
// Storage shim before each test so respondent-identity tests get
// standard Storage semantics. Mirrors dtpr-ai/test/setup.ts.
import { afterEach, beforeEach } from 'vitest'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()

  get length(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value))
  }
}

function installStorage() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: new MemoryStorage(),
  })
}

beforeEach(installStorage)
afterEach(installStorage)
