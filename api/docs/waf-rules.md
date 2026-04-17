# WAF rate-limit rules

These rules sit at the Cloudflare WAF layer and fire before the Worker
runs. They are the coarse, per-IP absolute caps referenced in the plan
(R29). The Workers Rate Limit API bindings (`RL_READ`, `RL_VALIDATE`)
are the second tier — tighter, per-`(IP, DTPR-Client)` tuple, applied
inside the Worker. Both must be in place for the full protection.

Source of truth: this document. Changes made directly in the
Cloudflare dashboard must be mirrored here; the dashboard is audited
quarterly against what's written down.

## Rules

All three rules use `action = block` with a typed 429 response —
agents cannot solve `managed_challenge`, and silent lock-out is worse
than a clear error.

### Rule 1: GET /api/v2/*

- **Zone**: `dtpr.io`
- **Hostname filter**: `api.dtpr.io` (and `api-preview.dtpr.io` for preview)
- **Expression**: `(http.request.method eq "GET" and starts_with(http.request.uri.path, "/api/v2/"))`
- **Counting**: per `ip.src`
- **Period**: 60 seconds
- **Requests per period**: 1000
- **Action**: block

Rationale: covers the entire public read surface. 1000/min/IP
accommodates mobile-carrier CGNAT and the Worcester app's burstier
sessions without opening a path for an abusive client to soak the
Worker-tier quota by themselves.

### Rule 2: POST /api/v2/*/validate

- **Zone**: `dtpr.io`
- **Hostname filter**: `api.dtpr.io` (and `api-preview.dtpr.io` for preview)
- **Expression**: `(http.request.method eq "POST" and ends_with(http.request.uri.path, "/validate"))`
- **Counting**: per `ip.src`
- **Period**: 60 seconds
- **Requests per period**: 30
- **Action**: block

Rationale: validate is the expensive write-ish path — it reads several
R2 objects and runs the full semantic rule set. 30/min/IP is well
above demo traffic but low enough that an abusive client can't drive
Worker CPU on this path alone.

### Rule 3: /mcp

- **Zone**: `dtpr.io`
- **Hostname filter**: `api.dtpr.io` (and `api-preview.dtpr.io` for preview)
- **Expression**: `(http.request.uri.path eq "/mcp")`
- **Counting**: per `ip.src`
- **Period**: 60 seconds
- **Requests per period**: 300
- **Action**: block

Rationale: a single MCP session can easily emit 20–30 tool calls. 300
per minute per IP lets a few concurrent sessions run without tripping
the absolute cap while still ring-fencing an abusive client to one
order of magnitude above baseline. The Worker-tier binding does the
finer `(IP, DTPR-Client)` tuple limiting that defeats shared-egress
pools.

## 429 body contract

When WAF blocks a request, Cloudflare returns its default 429 page.
That's acceptable for this MVP — we explicitly document in
`api/docs/api-usage.md` that a raw Cloudflare 429 at the edge means
"you exceeded the WAF cap; back off for 60 s." The typed envelope
only appears for Worker-tier 429s (`Retry-After` + `rate_limited` code
+ `DTPR-Client` fix_hint). This split is intentional: the WAF tier
can't format envelopes cheaply, and at its fire rate the delta
doesn't matter for diagnosis.

## Provisioning checklist

One-time manual steps before the first stable promotion. Owner:
whoever provisions the Cloudflare-side infrastructure.

- [ ] Create each rule above in Cloudflare dashboard
      (Security → WAF → Rate limiting rules).
- [ ] Apply identical rules to both `api.dtpr.io` and
      `api-preview.dtpr.io` (adjust the hostname filter).
- [ ] Confirm actions are all `block`, not `managed_challenge`.
- [ ] Record rule IDs in the team runbook for audit.
- [ ] Schedule a quarterly sync against this document.

## Tuning signals

Revisit when any of the following happens:

- The Worker-tier binding (`RL_READ` or `RL_VALIDATE`) fires ≥1% of
  requests for legitimate clients.
- Observability shows a legitimate `DTPR-Client` value consistently
  near the WAF cap.
- Traffic baseline (brainstorm: ~10 k req/day) triples or more.
- A new consumer class (non-Worcester, non-demo) comes online.
