// Validate-and-resolve API client for the datachain visualizer page.
//
// Both endpoints share a soft-failure envelope (`{ ok: false, errors }`
// with HTTP 200) for parse / semantic errors, and a 404 envelope
// (`{ ok: false, errors: [{ code: 'not_found', ... }] }`) for unknown
// schema versions. We surface every failure mode through the same
// `ApiError[]` shape so the UI's error panel does not branch on origin.
//
// Validate is called before resolve even though resolve runs the
// semantic validator internally. Calling validate first keeps the
// implementation's intent (R3 then R5) on the surface and guarantees
// the same error shape regardless of any future change to resolve's
// short-circuit behavior.

import type { ResolvedDatachainInstance } from '@dtpr/ui/core'
import { DTPR_API_BASE, DTPR_FETCH_TIMEOUT_MS } from './dtpr-api-config'

export interface ApiError {
  code: string
  message: string
  path?: string
  fix_hint?: string
}

export type ValidateAndResolveResult =
  | { ok: true; resolved: ResolvedDatachainInstance }
  | { ok: false; errors: ApiError[] }

interface ValidateOkEnvelope {
  ok: true
  warnings?: ApiError[]
}

interface ValidateErrorEnvelope {
  ok: false
  errors: ApiError[]
  warnings?: ApiError[]
}

interface ResolveOkEnvelope {
  ok: true
  version: string
  resolved: ResolvedDatachainInstance
  warnings?: ApiError[]
}

type ValidateEnvelope = ValidateOkEnvelope | ValidateErrorEnvelope
type ResolveEnvelope = ResolveOkEnvelope | ValidateErrorEnvelope

function readSchemaVersion(jsonText: string):
  | { ok: true; version: string }
  | { ok: false; errors: ApiError[] } {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    return {
      ok: false,
      errors: [
        {
          code: 'invalid_json',
          message: `JSON is not parseable: ${(err as Error).message}`,
          fix_hint: 'Fix the JSON syntax (often a stray comma or missing quote) and retry.',
        },
      ],
    }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      ok: false,
      errors: [
        {
          code: 'invalid_json',
          message: 'Top-level JSON value must be an object.',
          fix_hint: 'Wrap your DatachainInstance fields in `{ ... }`.',
        },
      ],
    }
  }
  const versionRaw = (parsed as { schema_version?: unknown }).schema_version
  if (typeof versionRaw !== 'string' || versionRaw.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: 'invalid_json',
          message: 'Missing or empty `schema_version` at the root of the instance.',
          path: 'schema_version',
          fix_hint:
            'Set `schema_version` to a published DTPR AI schema version (e.g. `ai@2026-05-06-beta`).',
        },
      ],
    }
  }
  return { ok: true, version: versionRaw }
}

async function postJson<T>(url: string, body: string, signal: AbortSignal): Promise<{
  status: number
  envelope: T | null
}> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    signal,
  })
  let envelope: T | null = null
  try {
    envelope = (await response.json()) as T
  } catch {
    envelope = null
  }
  return { status: response.status, envelope }
}

function unsupportedVersionErrors(version: string, envelope: ValidateErrorEnvelope | null): ApiError[] {
  const apiMessage = envelope?.errors?.[0]?.message
  return [
    {
      code: 'unsupported_schema_version',
      message:
        apiMessage ??
        `Schema version “${version}” is not registered with the DTPR API.`,
      path: 'schema_version',
      fix_hint:
        'List published versions via GET /api/v2/schemas, or pin to one the API still serves.',
    },
  ]
}

function networkErrors(err: unknown): ApiError[] {
  const reason = err instanceof Error ? err.message : String(err)
  return [
    {
      code: 'network_error',
      message: `Could not reach the DTPR API: ${reason}`,
      fix_hint:
        'Check your network connection and retry. The visualizer requires the public API to validate and render chains.',
    },
  ]
}

/**
 * Validate the JSON against `/validate`, then resolve via `/resolve`.
 * Returns the resolved instance on success; an `ApiError[]` on any
 * failure (invalid JSON, unknown schema version, validate failure,
 * resolve failure, network failure, request timeout).
 */
export async function validateAndResolve(jsonText: string): Promise<ValidateAndResolveResult> {
  const versionResult = readSchemaVersion(jsonText)
  if (!versionResult.ok) return versionResult

  const version = versionResult.version
  const encodedVersion = encodeURIComponent(version)
  const validateUrl = `${DTPR_API_BASE}/schemas/${encodedVersion}/validate`
  const resolveUrl = `${DTPR_API_BASE}/schemas/${encodedVersion}/resolve`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DTPR_FETCH_TIMEOUT_MS)

  try {
    let validateResp: { status: number; envelope: ValidateEnvelope | null }
    try {
      validateResp = await postJson<ValidateEnvelope>(validateUrl, jsonText, controller.signal)
    } catch (err) {
      return { ok: false, errors: networkErrors(err) }
    }

    if (validateResp.status === 404) {
      return {
        ok: false,
        errors: unsupportedVersionErrors(
          version,
          validateResp.envelope as ValidateErrorEnvelope | null,
        ),
      }
    }
    if (validateResp.status >= 400 || !validateResp.envelope) {
      const fallback: ApiError[] = (validateResp.envelope as ValidateErrorEnvelope | null)
        ?.errors ?? [
        {
          code: 'api_error',
          message: `Validate request failed with HTTP ${validateResp.status}.`,
          fix_hint: 'Retry; if persistent, the DTPR API may be degraded.',
        },
      ]
      return { ok: false, errors: fallback }
    }
    if (validateResp.envelope.ok === false) {
      return { ok: false, errors: validateResp.envelope.errors }
    }

    let resolveResp: { status: number; envelope: ResolveEnvelope | null }
    try {
      resolveResp = await postJson<ResolveEnvelope>(resolveUrl, jsonText, controller.signal)
    } catch (err) {
      return { ok: false, errors: networkErrors(err) }
    }

    if (resolveResp.status === 404) {
      return {
        ok: false,
        errors: unsupportedVersionErrors(
          version,
          resolveResp.envelope as ValidateErrorEnvelope | null,
        ),
      }
    }
    if (resolveResp.status >= 400 || !resolveResp.envelope) {
      const fallback: ApiError[] = (resolveResp.envelope as ValidateErrorEnvelope | null)
        ?.errors ?? [
        {
          code: 'api_error',
          message: `Resolve request failed with HTTP ${resolveResp.status}.`,
          fix_hint: 'Retry; if persistent, the DTPR API may be degraded.',
        },
      ]
      return { ok: false, errors: fallback }
    }
    if (resolveResp.envelope.ok === false) {
      return { ok: false, errors: resolveResp.envelope.errors }
    }

    return { ok: true, resolved: resolveResp.envelope.resolved }
  } finally {
    clearTimeout(timeout)
  }
}
