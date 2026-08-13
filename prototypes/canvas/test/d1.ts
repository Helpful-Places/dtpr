import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Database from 'better-sqlite3'
import type { D1Database, D1PreparedStatement } from '../server/utils/db'

// A better-sqlite3-backed D1 shim so unit tests exercise the *real* SQL
// in server/utils/db.ts (the same statements that run against Cloudflare
// D1 in production), not a hand-rolled mock. Covers the subset of the D1
// API the feedback layer uses: prepare().bind().run()/.all()/.first().
class Stmt implements D1PreparedStatement {
  constructor(private db: Database.Database, private sql: string, private args: unknown[] = []) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new Stmt(this.db, this.sql, values)
  }

  async run(): Promise<unknown> {
    this.db.prepare(this.sql).run(...(this.args as never[]))
    return { success: true }
  }

  async all<T = unknown>(): Promise<{ results: T[] }> {
    const results = this.db.prepare(this.sql).all(...(this.args as never[])) as T[]
    return { results }
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.args as never[])) as Record<string, T> | undefined
    if (!row) return null
    return colName ? row[colName] ?? null : (row as unknown as T)
  }
}

class TestD1 implements D1Database {
  constructor(private db: Database.Database) {}
  prepare(query: string): D1PreparedStatement {
    return new Stmt(this.db, query)
  }
}

// Vitest runs from the package root (canvas/), so resolve from cwd.
const MIGRATION = resolve(process.cwd(), 'migrations/0001_init.sql')

/** A fresh in-memory D1, schema applied from the real migration file. */
export function makeTestD1(): D1Database {
  const sqlite = new Database(':memory:')
  sqlite.exec(readFileSync(MIGRATION, 'utf8'))
  return new TestD1(sqlite)
}
