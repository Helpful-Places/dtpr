-- Feedback store (Cloudflare D1 / SQLite), binding FEEDBACK_DB.
-- Two tables: an anonymous respondent and a response row keyed to the
-- canvas coordinates. Canvas content itself is NOT in D1 — it lives in
-- the repo (KTD3); responses reference the stable (system, variant,
-- version, seat) keys so a restyle never orphans prior feedback (R3).

CREATE TABLE IF NOT EXISTS respondent (
  respondent_id   TEXT PRIMARY KEY,
  respondent_type TEXT NOT NULL,            -- 'public' | 'professional'
  contact         TEXT,                     -- optional, respondent-controlled
  created_at      INTEGER NOT NULL          -- epoch millis
);

CREATE TABLE IF NOT EXISTS feedback_response (
  id            TEXT PRIMARY KEY,
  respondent_id TEXT NOT NULL REFERENCES respondent(respondent_id),
  system_key    TEXT NOT NULL,
  variant_key   TEXT NOT NULL,
  version_key   TEXT NOT NULL,
  seat_key      TEXT,                        -- NULL for canvas-level feedback
  scope         TEXT NOT NULL,               -- 'seat' | 'canvas'
  reaction      TEXT NOT NULL,               -- 'clear' | 'confusing' | 'unsure'
  note          TEXT,                        -- optional short note
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_system
  ON feedback_response (system_key, variant_key, version_key);
