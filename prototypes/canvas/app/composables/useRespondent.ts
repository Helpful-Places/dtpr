import { ref, computed } from 'vue'

// Anonymous, localStorage-persisted respondent identity (KD5 / R11–R14).
// No accounts: a client-generated id persists locally so return visits
// aggregate and the one-time self-tag is not re-asked. Contact is always
// optional; nothing identifying is required to participate.

export type RespondentType = 'public' | 'professional'

const KEY_ID = 'dtpr.respondent.id'
const KEY_TYPE = 'dtpr.respondent.type'
const KEY_CONTACT = 'dtpr.respondent.contact'

const hasStorage = (): boolean => typeof localStorage !== 'undefined'

// ── Pure storage helpers (unit-tested against the localStorage shim) ──

/** Return the persisted respondent id, generating + persisting one on the
 *  first visit. Stable across reloads (AE1). */
export function ensureId(): string {
  if (!hasStorage()) return ''
  let id = localStorage.getItem(KEY_ID)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY_ID, id)
  }
  return id
}

export function getType(): RespondentType | null {
  if (!hasStorage()) return null
  const v = localStorage.getItem(KEY_TYPE)
  return v === 'public' || v === 'professional' ? v : null
}

export function setType(type: RespondentType): void {
  if (hasStorage()) localStorage.setItem(KEY_TYPE, type)
}

export function getContact(): string | null {
  if (!hasStorage()) return null
  return localStorage.getItem(KEY_CONTACT)
}

export function setContact(contact: string | null): void {
  if (!hasStorage()) return
  if (contact && contact.trim()) localStorage.setItem(KEY_CONTACT, contact.trim())
  else localStorage.removeItem(KEY_CONTACT)
}

/** True once the respondent has self-tagged — used to ask exactly once. */
export function isTagged(): boolean {
  return getType() !== null
}

export interface RespondentSnapshot {
  id: string
  type: RespondentType | null
  contact: string | null
}

/** Snapshot for attaching to a submission (contact may be null — R13). */
export function loadRespondent(): RespondentSnapshot {
  return { id: ensureId(), type: getType(), contact: getContact() }
}

// ── Reactive composable (module singleton so all feedback UI shares state) ──
const id = ref('')
const type = ref<RespondentType | null>(null)
const contact = ref<string | null>(null)
let initialized = false

function init(): void {
  if (initialized || !hasStorage()) return
  id.value = ensureId()
  type.value = getType()
  contact.value = getContact()
  initialized = true
}

export function useRespondent() {
  init()

  /** Record the one-time self-tag (and optional contact). */
  function tag(t: RespondentType, c?: string | null): void {
    setType(t)
    type.value = t
    if (c !== undefined) {
      setContact(c)
      contact.value = c && c.trim() ? c.trim() : null
    }
  }

  /** The payload shape the feedback POST expects for `respondent`. */
  function forSubmit(): { id: string, type: RespondentType, contact: string | null } | null {
    init()
    if (!type.value) return null
    return { id: id.value || ensureId(), type: type.value, contact: contact.value }
  }

  return {
    id,
    type,
    contact,
    tagged: computed(() => type.value !== null),
    tag,
    forSubmit,
  }
}
