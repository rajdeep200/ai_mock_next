// lib/interview.ts
// Constants and helpers shared by the interview API routes and the interview page.

// ---- Limits (enforced on the server) ----
export const MAX_TURNS = 150; // AI turns per interview
export const MIN_TURN_GAP_MS = 1000; // minimum time between two turns
export const GRACE_SECONDS = 120; // how long after the scheduled end a turn is still accepted
export const MAX_MESSAGE_CHARS = 8000; // one spoken answer or one code submission
export const MAX_LIVE_CODE_CHARS = 6000; // editor snapshot attached to a turn
export const MAX_CONTEXT_CHARS = 60_000; // transcript sent to the model per turn (oldest dropped first)

// ---- Control token the interviewer emits to end the session ----
export const END_TOKEN_REGEX = /(?:\[|<)?\s*END[\s_\-]*INTERVIEW\s*(?:\]|>|\/>)?/i;
export const containsEndToken = (text: string) => !!text && END_TOKEN_REGEX.test(text);

// ---- Hidden message sent to the model after a long mutual silence ----
export const SILENCE_CHECKIN =
  "The candidate has been silent for more than 2 minutes. Briefly check in (≤1 sentence) and ask if they need a hint or have any issue.";

// ---- Closing turn: the client sends it shortly before time runs out so the interviewer can say goodbye ----
export const WRAPUP_LEAD_SECONDS = 75; // how long before the end the closing turn is requested
export const WRAPUP_INSTRUCTION =
  "Time is almost up. Wrap the interview up now, in this one reply (at most 50 words, spoken style, no markdown): " +
  "tell the candidate warmly that you need to wrap up because you're out of time, acknowledge one specific thing they did in this interview, " +
  "thank them, and say they'll get detailed feedback right after. Do not ask a question, do not start a new topic, and do not output [END_INTERVIEW].";

// ---- Feedback text used when no real AI feedback could be produced ----
export const FEEDBACK_FAILED = "Feedback could not be generated for this session.";
export const FEEDBACK_NO_ANSWERS =
  "No feedback was generated because the interview ended before any answers were recorded.";
export const FEEDBACK_ABANDONED =
  "This interview ended early because the page was closed or refreshed, so no feedback was generated.";

export type TurnType = "start" | "message" | "code" | "silence" | "wrapup";

export type TurnResponse = {
  reply: string;
  ended: boolean; // the interviewer asked to end the session
  remainingSec: number; // seconds left, measured by the server from the session start
};

export type ApiErrorCode =
  | "NOT_ACTIVE"
  | "TIME_UP"
  | "TURN_CAP"
  | "TOO_FAST"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "UPSTREAM";
