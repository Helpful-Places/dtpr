// Node 25 ships its own `globalThis.localStorage` that requires the
// `--localstorage-file` flag to be a real Storage; without one it
// surfaces as a bare object with no Storage methods. That ghost
// overrides the Storage that jsdom would otherwise install. We
// replace `window.localStorage` with a small in-memory Storage shim
// for every test so unit tests can rely on standard Storage semantics
// without the Node 25 / jsdom interaction.
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

beforeEach(() => {
  installStorage()
})

afterEach(() => {
  installStorage()
})
