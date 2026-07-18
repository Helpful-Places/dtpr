/**
 * EVERY number in the game lives here. Each constant is a playtest question,
 * not an answer — tune freely between sessions.
 */
export const TUNING = {
  ROUNDS: 5,

  // starting resources & dials
  BUDGET_START: 8, // deployer coins, whole game
  ATTENTION_PER_ROUND: 3, // community pips, reset each round
  UTILITY_START: 6,
  LEGITIMACY_START: 5,
  DIAL_MIN: 0,
  DIAL_MAX: 10,
  FLOOR: 3, // either dial <= FLOOR ends the game (collapse / woundDown)
  TRUSTED: 7, // both dials >= TRUSTED (+ forum) = deployedTrusted

  // community move costs (attention)
  COST_QUESTION: 1,
  COST_REVEAL_CONTEXT: 1,
  COST_PROPOSE_FORUM: 1,

  // deflect
  DEFLECT_LEGIT: -1,
  DEFLECT_LEGIT_OVERSIGHT: -2, // while Community Oversight Seat is seated
  DEFLECT_SEEDS: 1,
  DEFLECT_SEEDS_NO_FORUM: 2, // the zero-sum lock rule: empty table doubles seeding
  SEALED_ANSWER_LEGIT: -1, // answering a question aimed at the sealed card: "we don't know"

  // endings
  REDESIGNED_MIN_DIAL: 5, // redesignedTrusted: both dials >= this
  REDESIGNED_MIN_COUNT: 2, // ...and this many redesigns applied
  OVER_OBJECTION_MIN_UTILITY: 5,
  OVER_OBJECTION_MAX_LEGIT: 5, // "Legitimacy below 6"
  WOUND_DOWN_RECOVERY: 2, // sunset clause: both dials recover this at collapse

  // vendor squeezes
  RENEGOTIATE_NOW_SURCHARGE: 1, // "The data is ours": renegotiate immediately at redesign cost + this
  ONDEVICE_COST_DELTA: 2, // "Cloud, or the price doubles": On-Device Matching costs +2 from now on
  PROPRIETARY_AUDIT_DELTA: 1, // "That's proprietary": audit forum +1 unless fine print renegotiated
  UPGRADE_UTILITY: 1, // emotion-detection upgrade accepted
  UPGRADE_DECLINE_COST: 0, // recorded interpretation: declining the upgrade is free
  DISCOUNT_BUDGET: 2, // "Reference customer discount"
  DISCOUNT_DEFLECT_SURCHARGE: 1, // ...and every future Deflect costs +1 Legitimacy

  // context card teeth
  NIGHTSHIFT_FALSEMATCH_MULT: 2, // night false-matches hit double (unless human at the gate)
  JUMPERS_ENFORCEMENT_LEGIT: -1, // enforcement events while police access stands
  LEAVING_QUIETLY_BREACH_EXTRA: -2, // breach severity while the movement log exists
  PLAZA_SCOPE_CREEP_LEGIT: -2, // accepting scope creep after Plaza Regulars revealed
  STATION_MEMORY_UPGRADE_MULT: 2, // vendor-upgrade legit costs double (unless sunset seated)

  // events
  BREACH_BAD_LEGIT: -4, // cloud + years of retention
  BREACH_SAFE_LEGIT: 2, // the told-you-so bonus
  BUDGET_CUT: -2,
  ELECTION_SCALE: 2, // legitimacy changes doubled...
  ELECTION_SCALE_OVERSIGHT: 0.5, // ...or halved with the oversight seat
  ELECTION_ROUNDS: 1, // runs through NEXT upkeep (decremented at upkeep; active while >= 0)
  FOIA_PER_DEFLECT_LEGIT: -1,
  FOIA_ALL_FACEUP_LEGIT: 1, // requires all 9 cards face-up (seal opened)
  FALSEMATCH_BAD_LEGIT: -3,
  FALSEMATCH_BAD_SEEDS: 1,
  FALSEMATCH_HANDLED_LEGIT: -1,
  FALSEMATCH_HANDLED_BONUS: 1, // "+1 back — handled well is a story that helps"
  PROTEST_SURFACED_LEGIT: -3, // lands when The FOIA surfaces the quiet handover
  PROTEST_WARRANT_LEGIT: 2,
  TWINS_FIXED_LEGIT: 1,
  TWINS_BAD_LEGIT: -1,
  RIDERSHIP_NOPAPERS_UTILITY: -2,
  RIDERSHIP_SKIPLANE_UTILITY: -1,
  RIDERSHIP_CONFIRMED_UTILITY: 1,
  DATABROKER_BAD_LEGIT: -3, // vendor owns the data + the movement log exists
  DATABROKER_THIN_LEGIT: -1, // vendor owns it but there's only pass/no-pass
  DATABROKER_VOIDED_LEGIT: 1, // fine print renegotiated

  // backlash
  FARESTRIKE_UTILITY: -2,
  FARESTRIKE_LEGIT: -1,
  COURT_SETTLE_BUDGET: -1, // with Contest & Correct
  COURT_FREEZE_ROUNDS: 1, // otherwise: utility frozen
  GATES_OPEN_UTILITY: -2,

  // forum absorption (applyForumFilters)
  NOTICE_DISCOVERS_FACTOR: 0.5, // halves "public discovers" legit penalties (trunc toward 0)
  HUMAN_REVIEW_FALSEMATCH_FACTOR: 0.5, // halves wrongful-stop legit penalties (trunc toward 0)
  AUDIT_ACCURACY_SOFTEN: 1, // accuracy penalties resolve one step milder

  // redesign side effects
  TAPTOSKIP_UTILITY: -1, // a slower lane
  HUMAN_AT_GATE_UTILITY: -1, // slower at peak, while staffed
  HUMAN_AT_GATE_UPKEEP: 1, // pay every round or it lapses

  // rules interpretations recorded as knobs
  ALLOW_SPONTANEOUS_REDESIGN: false, // redesigns play only as question responses
  VENDOR_RENEGOTIATE_COUNTS_AS_REDESIGN: true, // toward redesignedTrusted's count
  REDESIGN_FLIPS_TARGET_FACEUP: true, // playing a redesign discloses the card it swaps
} as const;

export type Tuning = typeof TUNING;
