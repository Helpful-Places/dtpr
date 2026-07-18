/** Shared content + state types. G stores only ids and status; all card text lives in content defs. */

export type Seat = '0' | '1';
export const DEPLOYER: Seat = '0';
export const COMMUNITY: Seat = '1';

export type SystemCardId =
  | 'pitch' | 'model' | 'reads' | 'makes' | 'lives'
  | 'sees' | 'long' | 'fineprint' | 'error';

export type ContextId =
  | 'nightShift' | 'jumpers' | 'noPapers' | 'misread'
  | 'leavingQuietly' | 'plazaRegulars' | 'stationMemory';

export type QuestionId =
  | 'whoCanSee' | 'howLong' | 'whereLives' | 'decidesAlone' | 'whenWrong'
  | 'canISayNo' | 'whoProfits' | 'whatElse' | 'usedOn';

export type ForumId = 'notice' | 'humanReview' | 'contest' | 'oversight' | 'audit' | 'sunset';

export type RedesignId =
  | 'onDevice' | 'purge24' | 'tapToSkip' | 'noLocationLog'
  | 'humanAtGate' | 'warrantOnly' | 'renegotiate';

export type VendorId =
  | 'dataIsOurs' | 'cloudOrDouble' | 'proprietary' | 'emotionUpgrade' | 'referenceDiscount';

export type BacklashId = 'fareStrike' | 'court' | 'councilHearing' | 'gatesHeldOpen';

export type EventId =
  | 'breach' | 'budgetCut' | 'electionYear' | 'foia'
  | 'falseMatch' | 'protest' | 'twins' | 'ridership' | 'dataBroker'
  | BacklashId;

/** The mutable board truth that events resolve against. Redesigns swap these fields. */
export interface SystemValues {
  autonomy: 'autonomous' | 'human_executes';
  retention: 'years7' | 'hours24';
  storage: 'vendorCloud' | 'onDevice';
  policeAccess: 'onRequest' | 'warrantOnly';
  outputLog: 'movementLog' | 'passOnly';
  enrollment: 'everyRider' | 'enrolledOnly';
  dataOwner: 'vendor' | 'city';
  purposes: string[]; // farePayment (+ emotion if the upgrade is accepted)
}

export type QuestionStatus = 'hand' | 'pending' | 'answered' | 'deflected' | 'redesigned';
export type RedesignStatus = 'hand' | 'applied' | 'lapsed';
export type ForumStatus = 'deck' | 'proposed' | 'seated';

export type EndingId =
  | 'collapse' | 'woundDown' | 'deployedTrusted' | 'redesignedTrusted'
  | 'overObjection' | 'stalled';

/** Tags let forum absorption find the lines it modifies. */
export type LineTag = 'publicDiscovers' | 'falseMatch' | 'accuracy';

/** Everything a resolver line can do to the world. */
export interface Deltas {
  utility?: number;
  legitimacy?: number;
  budget?: number;
  seedBacklash?: number; // shuffle N backlash cards into the remaining event deck
  flipCard?: SystemCardId; // force face-up; breaks the seal if sealed
  freezeUtility?: number; // rounds
  legitScale?: { factor: number; rounds: number }; // election year
  surfaceProtest?: boolean; // protest complied quietly — pin the −3 for the FOIA
  clearProtest?: boolean; // the FOIA surfaced it
  defuseFareStrike?: boolean; // contest & correct, once per game
}

export interface RawLine {
  cond: string; // the printed condition
  text: string; // what happens
  fired: boolean;
  deltas?: Deltas;
  tags?: LineTag[];
}

export interface ResolvedLine extends RawLine {
  /** dial movement actually applied (post-filter, post-scaling, post-clamp) */
  applied?: { utility: number; legitimacy: number; budget: number };
  /** forum names that softened this line */
  absorbedBy?: string[];
}

export interface LogEntry {
  round: number;
  source: 'system' | 'vendor' | 'community' | 'deployer' | 'event';
  text: string;
}
