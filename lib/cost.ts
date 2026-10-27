// lib/cost.ts
// What an interview costs us. Token and character counts are stored per session (they never change);
// the dollar figure is computed from the prices below, so a price change only needs an edit here.
// Prices are list prices in USD (check the OpenAI and AWS pricing pages before relying on them).

export type SessionUsage = {
  turnCalls?: number;
  turnInTokens?: number;
  turnOutTokens?: number;
  ttsCalls?: number;
  ttsChars?: number;
  scoreModel?: string;
  scoreInTokens?: number;
  scoreOutTokens?: number;
};

// USD per 1M tokens
export const TOKEN_PRICES: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4.1": { in: 2, out: 8 },
};
const UNKNOWN_MODEL_PRICE = { in: 2, out: 8 }; // assume a pricey model rather than undercount
export const TURN_MODEL_ID = "gpt-4o-mini";

// USD per 1M characters (Polly standard voices)
export const POLLY_STANDARD_PER_M_CHARS = 4;

const priceOf = (model?: string) => (model && TOKEN_PRICES[model]) || UNKNOWN_MODEL_PRICE;

export function estimateCost(u: SessionUsage | null | undefined) {
  const x = u ?? {};
  const turn = priceOf(TURN_MODEL_ID);
  const score = priceOf(x.scoreModel);
  const turns = ((x.turnInTokens ?? 0) * turn.in + (x.turnOutTokens ?? 0) * turn.out) / 1e6;
  const tts = ((x.ttsChars ?? 0) * POLLY_STANDARD_PER_M_CHARS) / 1e6;
  const scoring = ((x.scoreInTokens ?? 0) * score.in + (x.scoreOutTokens ?? 0) * score.out) / 1e6;
  return { turns, tts, scoring, total: turns + tts + scoring };
}
