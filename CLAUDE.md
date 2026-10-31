# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this project is

**MockQube** (package name `aimock`) — an AI-powered mock interview platform. Signed-in users start a
timed, voice-driven DSA interview against an OpenAI-backed interviewer, talk out loud (browser
speech-to-text) and/or write code in an in-browser Monaco editor, hear the interviewer's replies via AWS
Polly text-to-speech, and receive a rubric-scored feedback report with a "preparation percentage". A
progress dashboard tracks skills, recurring habits and trends across interviews. Sessions, users,
usage/quota, subscriptions and referral invites are persisted in MongoDB. Auth is Clerk. Payments
(India-focused, INR) are Cashfree. Deployed target is Vercel (Next.js + `@vercel/analytics`).

Marketing/site scaffolding (blog, pricing, privacy/terms/refund policy, contact, SEO metadata,
sitemap/robots, OG image generation) is also part of the app — this is a live SaaS product, not a demo.

## Tech stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript (strict), Turbopack for `dev`.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) plus hand-written per-page CSS files
  (`interview.css`, `dashboard.css`, `home.css`, `pricing.css`, `feedback.css`, `start.css`, ...), dark
  theme with emerald/green accents. Pages fetch Bricolage Grotesque + Figtree via `next/font`.
- **Auth**: Clerk (`@clerk/nextjs`) — see `middleware.ts`.
- **Database**: MongoDB via Mongoose (`lib/mongodb.ts`), single connection cached on `global`, db name `aimock`.
- **AI**: OpenAI (`openai` SDK). Live interview turns use `gpt-4o-mini` (streamed). End-of-interview scoring
  uses `OPENAI_SCORING_MODEL` (default `gpt-4.1`) with structured JSON output, falling back to `gpt-4o-mini`.
- **TTS**: AWS Polly (`@aws-sdk/client-polly`), returned as `audio/mpeg`.
- **STT**: `react-speech-recognition` (browser Web Speech API) — client-side only, no server STT.
- **Code editor**: Monaco (`@monaco-editor/react`), dynamically imported with SSR disabled.
- **Charts**: `recharts` (dashboard). **3D**: `three` (landing hero cube).
- **Payments**: Cashfree (`@cashfreepayments/cashfree-js` client SDK + REST API server-side via `lib/cashfree.ts`).
- **Validation**: `zod` on most API routes.
- **Content**: `@next/mdx` for blog pages (`.mdx`/`.md` under `pageExtensions`).
- **Misc**: `date-fns`, `axios`.

## Environment variables

`.env` is gitignored; `env.txt` lists only a partial starter set. Vars actually referenced in code:

| Var | Used by | Purpose |
|---|---|---|
| `MONGODB_URI` | `lib/mongodb.ts`, `api/feedback` | Mongo connection string |
| `OPENAI_API_KEY` | `api/interview/turn`, `lib/scoring.ts` | OpenAI |
| `OPENAI_SCORING_MODEL` | `lib/scoring.ts` | scoring model (default `gpt-4.1`; reasoning models `gpt-5*`/`o*` are handled, no temperature) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk | auth |
| `AWS_REGION` (default `us-east-1`), standard AWS credential vars (SDK default chain) | `api/tts` | Polly |
| `POLLY_DEFAULT_VOICE`, `POLLY_ENGINE` | `api/tts` | optional TTS tuning (engine currently ignored, see gotchas) |
| `CASHFREE_ENV` (`sandbox`\|`production`), `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` | `lib/cashfree.ts` | Cashfree REST auth |
| `CASHFREE_WEBHOOK_SECRET` | `api/webhooks/cashfree` | webhook signature check (log-only signal, see Billing) |
| `NEXT_PUBLIC_CASHFREE_MODE` | `app/pricing`, pricing client | client-side Cashfree SDK mode |
| `NEXT_PUBLIC_APP_URL` | checkout return/notify URLs, share URLs, invite links | canonical app origin |
| `NEXT_PUBLIC_SITE_URL` | `app/sitemap.ts`, `app/robots.ts`, `app/contact/page.tsx` | canonical marketing origin (`https://www.mockqube.com` fallback in `layout.tsx`) |
| `ADMIN_API_TOKEN` | `lib/authz.ts` → `api/admin/*` | bearer token for admin routes |
| `NEXT_PUBLIC_FEEDBACK_URL` | `component/dashboard/TrialBanner.tsx` | optional feedback form link for the trial banner (build-time; falls back to a `mailto:support@mockqube.com`) |
| `KEEP_LOGS` | `next.config.ts` | if `"1"`, keep `console.*` in production builds (otherwise all but `error`/`warn` are stripped) |

`NEXT_PUBLIC_ENC_KEY` is **no longer used** (the encrypted `/api/interview` route and `lib/crypto.ts` callers
were replaced by `/api/interview/turn`). `lib/crypto.ts` still exists but nothing live imports it.
`NEXT_PUBLIC_SUPABASE_*` / `@supabase/supabase-js` are vestigial — no usage in `app`/`lib`/`models`.

## Architecture

### Routing (App Router, `app/`)
- Public marketing: `/`, `/about`, `/pricing`, `/contact`, `/mock-interview`, `/blog/*` (MDX/TSX),
  `/privacy-policy`, `/terms`, `/refund-policy`. `/home` is the signed-in launchpad.
- **Auth-gated pages** (`middleware.ts` `isProtectedRoute`): `/home`, `/dashboard`, `/history`, `/start-interview`,
  `/interview(.*)`, `/billing(.*)`. `/sessions(.*)` is also protected. New authenticated-only pages must be added to that matcher.
- `component/ChromeGate.tsx` hides the global Header/Footer on pages that ship their own chrome
  (`/`, `/home`, `/dashboard`, `/history`, `/sessions/*`, `/s/*`, `/billing/return`, `/pricing`, `/start-interview`,
  `/interview`, `/interview/feedback`, `/about`, `/contact`, `/terms`, `/privacy-policy`, `/refund-policy`).
  Add new self-chromed pages to its list.
- **Information pages** (`/about`, `/contact`, `/terms`, `/privacy-policy`, `/refund-policy`) share `component/site/`:
  `SiteShell` (fonts, `SiteHeader`, `HomeFooter`, styles in `site.css` scoped under `.mqw`) and, for the legal pages,
  `LegalLayout` (heading, effective date, sticky `LegalToc` built from each `<section><h2>`, related-page links).
  Legal page bodies are plain `<section><h2>…</h2><p>/<ul>…` markup with no classes (use `className="muted"` for
  small print and `className="in"` for links); the intro goes in `<div className="intro">`. The contact form still
  opens a `mailto:` (no backend).
- **Interview flow**: `/start-interview` (company, level easy|medium|hard, duration, optional focus topic)
  → POST `/api/create-interview` → `/interview?sessionId=…&technology=dsa&company=…&level=…&duration=…`
  → on end POST `/api/interview/summary` → `/interview/feedback?sessionId=…` (rating form posts to
  `/api/feedback`, then redirects to `/history`).
- **History/detail**: `/history` (redesigned: month-grouped list with score rings and filters, via `/api/sessions`, which returns `percent`, `title`, `endedEarly` and never the transcript), `/sessions/[id]` (redesigned report: score ring, per-skill breakdown, parsed strengths/improvements, tags, timeline, ShareCard; reads `percent`, `breakdown`, `insights`, `endedEarly` from
  `/api/sessions/[id]`, `/api/sessions/[id]/share`).
- **Progress dashboard**: `/dashboard` (server component → `lib/dashboard-data.ts` `loadDashboard` →
  `component/dashboard/DashboardClient.tsx` + `charts.tsx`). Signed-in users land here.
- **Public share pages**: `/s/[slug]` (redesigned server component that reads the session directly: score ring,
  skill scores, the AI summary parsed via `lib/feedback.ts`, share buttons, sign-up band; it never shows the
  candidate's own words or a name). `/api/og/session/[slug]` renders the 1200x630 link image (edge runtime,
  Satori: the score ring is an inline SVG data URI and the font is the default) from `/api/share-public/[slug]`.
- **Billing**: `/pricing` → POST `/api/checkout` → Cashfree hosted checkout → `/billing/return` (neutral
  landing, polls GET `/api/billing/verify?orderId=…`) and `/billing/success`.
- **Invites/referrals**: `/invite/[token]` (redesigned: `SiteShell` frame, `InviteClient.tsx`, `invite.css`; it checks
  `/api/plan` on load and shows "new free users only" up front for paid users) → POST `/api/invites/redeem`;
  admin-only POST `/api/admin/invites`. A redeemed `pro_days` invite is an "invite trial": `plan: "pro"` with
  `planRenewsAt` set and no `subscriptionId`. It lapses to Free through `effectivePlanId` (nothing runs at expiry).
  The dashboard shows `TrialBanner` (days left, upgrade, feedback) for such users, and a "trial ended" version after.
  `ChromeGate` hides the global chrome on `/invite/*`.
- **Admin**: `GET /api/admin/costs?days=30` — average cost per interview grouped by duration (bearer `ADMIN_API_TOKEN`).

### API routes (all under `app/api/`)
`admin/costs`, `admin/invites`, `billing/verify`, `checkout`, `create-interview`, `feedback`,
`interview/turn`, `interview/summary`, `interview/abandon`, `invites/redeem`, `og/session/[slug]`, `plan`,
`register`, `sessions`, `sessions/[id]`, `sessions/[id]/share`, `share-public/[slug]`, `tts`, `user`,
`webhooks/cashfree`.

### The interview engine (core feature)

**The server owns the interview.** The browser only sends its next message; the server holds the
transcript, builds the system prompt, enforces limits and computes the score. The browser can no longer
write its own feedback or score.

- **Entry point**: `app/interview/page.tsx` → `app/interview/ClientInterview.tsx` (~1,240-line client
  component, SSR disabled). `hooks/useInterviewEngine.ts` and `component/interview/*` are an unused,
  reverted refactor (**dead code** — nothing imports them); `lib/tts-client.ts` is also unused because
  `ClientInterview.tsx` has its own inline TTS code. Edit `ClientInterview.tsx`, not the dead copies.
- **`POST /api/interview/turn`** (`runtime: nodejs`, `maxDuration: 30`): body
  `{ sessionId, type: "start"|"message"|"code"|"silence"|"wrapup", content?, liveCode? }` (strict zod).
  `silence` and `wrapup` add a hidden system instruction for the model only; `wrapup` is **not** saved to
  the transcript (system messages are counted as silence check-ins when scoring), only the reply is.
  1. Loads the session scoped by `{ _id, userId }`; 409 `NOT_ACTIVE` if completed; 403 `TIME_UP` past
     `duration + GRACE_SECONDS`; `start` on a session that already has a transcript returns the last
     interviewer message as plain JSON instead of restarting.
  2. Atomically *claims a turn* with `findOneAndUpdate` (`turnCount < MAX_TURNS`, `lastTurnAt` older than
     `MIN_TURN_GAP_MS`) → 403 `TURN_CAP` / 429 `TOO_FAST`.
  3. System prompt = `getPromptsForInterview(...)` (+ candidate first name from `User.fullName`, optional
     focus topic) + a `# Clock` note with minutes remaining. Transcript is trimmed to `MAX_CONTEXT_CHARS`
     (oldest first, keeping the opening message). Live editor content is attached as a `CURRENT_CODE`
     system message.
  4. Streams `gpt-4o-mini` back as **newline-delimited JSON**: `{t:"meta",remainingSec}`,
     `{t:"delta",text}`, `{t:"done",reply,ended,remainingSec}`, `{t:"error",error,code}`. The exchange is
     appended to `transcript` only when the reply completes; failed/aborted turns give the turn count back.
     Token usage is always recorded in `usage.turnCalls/turnInTokens/turnOutTokens`.
- **`POST /api/interview/summary`** (`maxDuration: 60`): body `{ sessionId }`. Takes a 90s lock
  (`summaryLockAt`), runs `evaluateInterview(transcript)` (`lib/scoring.ts`), then sets
  `status: "completed"`, `endTime`, `feedback`, `modelPreparationPercent`, `scoreBreakdown`, `insights`,
  `feedbackGenerated`. Idempotent: if `feedbackGenerated` is already true it returns the stored result.
  A failed evaluation completes the session but leaves `feedbackGenerated: false` (retryable).
- **`POST /api/interview/abandon`**: `navigator.sendBeacon` target on page close/refresh. Marks an *active*
  session `completed` with the placeholder `FEEDBACK_ABANDONED`. On reload the client sees a
  `sessionStorage` flag (`iv:<id>:ended`) and calls `/summary` to build real feedback from the stored transcript.
- **Limits and shared constants** live in `lib/interview.ts`: `MAX_TURNS` 150, `MIN_TURN_GAP_MS` 1000,
  `GRACE_SECONDS` 120, `MAX_MESSAGE_CHARS` 8000, `MAX_LIVE_CODE_CHARS` 6000, `MAX_CONTEXT_CHARS` 60k,
  `END_TOKEN_REGEX` (`[END_INTERVIEW]`), `SILENCE_CHECKIN`, the `FEEDBACK_*` placeholder strings, and the
  `ApiErrorCode` union. The server clock (from `session.startTime`) is authoritative; the client syncs its
  timer to `remainingSec` on the first reply and clamps to the plan max from `/api/plan`.
- **Client behaviour in `ClientInterview.tsx`**:
  - Replies stream in; each completed sentence is sent to `/api/tts` immediately and played in order
    (`createReplySpeaker`, `takeSentences`). Text for a sentence appears when its audio starts.
  - Speech is auto-sent after an adaptive silence window (3–6s, longer if the sentence sounds unfinished);
    "Hold on" pauses auto-send; "Send now" flushes. Barge-in: speaking (or Space) cancels TTS; a
    "headphones" mode (localStorage `mq-headphones`) keeps the mic open while the interviewer talks.
  - Turns made while one is in flight are queued and merged; retryable errors show a "Try again" banner;
    `TOO_FAST` retries silently; `TIME_UP`/`TURN_CAP` end the interview; `NOT_ACTIVE` redirects to `/sessions/[id]`.
  - 1s ticker: time-check lines at 5/2/1 minutes (local display + voice only, never sent to the model),
    2 minutes of mutual silence → `type: "silence"` turn.
  - **Closing turn**: at `WRAPUP_LEAD_SECONDS` (75s) left, once the first reply has synced the clock, the client
    sends `type: "wrapup"` (`WRAPUP_INSTRUCTION` in `lib/interview.ts`). The interviewer says goodbye, the reply
    is voiced in full (the end token is stripped, never spoken), and `handleEndInterview` runs when playback
    finishes. After this starts, `wrapupStartedRef` blocks further turns and the canned time checks. If the
    closing turn fails, or the user talks over it, the 0s hard stop (`handleEndInterview`) is the fallback.
  - `beforeunload` confirmation while live; `pagehide` fires the abandon beacon.
- **Prompts** (`lib/prompts.ts`): `getPromptsForInterview(topic, duration, company, level, candidateName,
  focus)`. Only `"dsa"` has a real prompt (`DSA_PROMPT`: level-based topic pool or the candidate's chosen
  focus topic, strict flow greeting → intro → warm-up → "Let's start the practical." → ambiguous problem →
  clarify → "You can now start writing code.", off-topic 3-strike rule ending with `[END_INTERVIEW]`,
  live-code and speech-to-text handling). Every other technology falls back to `DEFAULT_PROMPT`.
  `SUMMARY_PROMPT` is legacy/unused (scoring has its own prompt in `lib/scoring.ts`).
- **Plan enforcement**: `POST /api/create-interview` calls `checkCanStartInterview` (`lib/usage.ts`) →
  402 with `code: MAX_MINUTES | MONTHLY_CAP`, then 402 `TOPIC_LOCKED` if a `focus` topic is sent on a plan
  without the `topicFocus` feature, then creates the session and `recordInterviewStart`
  (usage is counted at start, not completion). The start page and interview page also clamp client-side.

### Scoring and insights (`lib/scoring.ts`, `lib/dimensions.ts`, `lib/insights.ts`)
- `evaluateInterview(transcript)` returns `{ feedback, percent, breakdown, insights, usage }`. No user turns
  → `FEEDBACK_NO_ANSWERS`; model failure on both models → `FEEDBACK_FAILED`.
- The model grades six weighted dimensions 0–10 with evidence (`DIMENSIONS`: understanding 15, approach 30,
  complexity 20, code 15, edge_cases 10, communication 10). **The percentage is computed in code**
  (`computePercent`): weighted over assessed dimensions, `null` if `approach` wasn't assessed or assessed
  weight < 30. Fewer than 3 user turns or `enough_signal: false` → no percent and no insights.
- Insights are tags from a fixed vocabulary (13 strengths, 13 issues, 23 topics in `lib/insights.ts`) plus
  problem title/topic, a 3–6 segment timeline, `hintsGiven`, `silenceCheckins` (counted in code from system
  messages) and `doNextTime`. Strength quotes must genuinely appear in candidate speech
  (`quoteIsGenuine`) or the tag is dropped; opposing strength/issue pairs (`CONFLICTS`) cancel out.
  Tag keys are persisted — add new ones freely, never rename/reuse (bump `INSIGHTS_VERSION` if meaning changes).
- The `feedback` string keeps a parseable shape (`Preparation Percentage: NN%|N/A`, `Reason:`, `Overall
  Summary:`, `Strengths:`, `Areas for Improvement:`, `Next Steps:`, optional `Score breakdown:`) that the
  feedback/detail/share/OG pages parse.

### Dashboard (`lib/dashboard.ts`, `lib/dashboard-data.ts`, `component/dashboard/*`)
- `loadDashboard(userId)` reads up to 300 `status: "completed", feedbackGenerated: true` sessions and the
  month's usage, and `buildDashboard` (pure functions, client-safe) derives stats, trend line, skills
  radar (avg of last 5, with "before" comparison), habit counts over the last 8 interviews, a practice plan
  (from `ISSUE_FIX`/`SKILL_FIX`), and per-interview cards. Trends/habits unlock after `UNLOCK_AT = 3`
  interviews; `READY_PERCENT = 70`. Streaks are computed in the browser (user's own timezone).
- Optional start-page `focus` topic ("Topic-wise interview", step 2, Starter and Pro only) is stored on the session
  (`FOCUS_KEYS` from `lib/insights.ts`). The picker is grouped by `FOCUS_GROUPS`; add new topics to `TOPICS` and to one group.

### Data model (`models/`, Mongoose)
- **`User`** — `clerkId` (unique), `email`, `fullName`, `plan` (`free`/`starter`/`pro`),
  `subscriptionProvider`/`subscriptionId`/`planRenewsAt`/`cancelAtPeriodEnd`, `phone`/`phoneVerified`.
  Created lazily by `component/RegisterUser.tsx` (mounted in `app/layout.tsx`) calling `POST /api/register`.
  `/api/user` GET/POST reads/updates name + phone.
- **`InterviewSession`** — `userId`, `technology`, `company`, `focus`, `level`, `duration` (min),
  `status` (`active`/`completed`), `startTime`/`endTime`, `feedback`, `modelPreparationPercent`,
  server-owned `transcript` (`{role, content, at}[]`), `turnCount`, `lastTurnAt`, `feedbackGenerated`,
  `summaryLockAt`, `scoreBreakdown` (Mixed), `insights` (Mixed), `usage` (turn/TTS/scoring token & char
  counts for cost), `customerRating`/`customerFeedback` (via `/api/feedback`), sharing fields `shareSlug`
  (unique sparse), `shareEnabled`, `sharedAt`. `summary` is a legacy field.
- **`Usage`** — one doc per `(userId, month)`; `interviewsCount`, `minutesUsed`. Month key is UTC `YYYY-MM`.
- **`SubscriptionOrder`** — one doc per Cashfree order: `userId`, `planId`, `orderId` (unique), `status`
  (`created`/`paid`/`failed`/`cancelled`), `amount`, `currency`, `raw`, `cfOrderId`, `cfPaymentId`,
  `lastWebhookEvent`/`lastWebhookNote` (now in the schema), `appliedAt` (set once the order has granted its plan).
- **`Invite`** — only `tokenHash` (SHA-256) is persisted; `status`, `benefit` (`{type:'pro_days', amount}`),
  `maxRedemptions`/`redemptions`, `expiresAt`, `campaign`; statics `hashToken()`, `findUsableByToken()`.
- **`InviteRedemption`** — one doc per `(inviteId, clerkId)` (unique index), written inside the redeem transaction;
  a repeat or concurrent redemption of the same invite returns 409 `ALREADY_REDEEMED`.

### Plans & quota (`lib/plans.ts`, `lib/usage.ts`)
Single source of truth in `PLANS`:
- `free`: 2 interviews/month, 15 min max.
- `starter`: 15/month, 30 min max (company patterns and topic focus flags on).
- `pro`: 25/month, 45 min max (all feature flags on).
`topicFocus` is enforced (server check in `/api/create-interview`, locked picker on the start page). The other feature
flags (`companyPatterns`, `premiumTTS`, `export`, `fullHistory`) are not enforced anywhere yet.
Paid plans are **30-day passes** (`PASS_DAYS`), never auto-renewed. `effectivePlanId(user)` treats a paid
plan whose `planRenewsAt` has passed as `free`; always use it (or `getUserPlan`) rather than reading
`user.plan` directly. A paid plan with no `planRenewsAt` (hand-granted) doesn't expire.

### Billing (Cashfree)
- `POST /api/checkout`: `PRICE_TABLE` is hardcoded (starter ₹599, pro ₹999). Rejects buying a lower plan than
  the current one (`LOWER_PLAN`) and renewing the same plan with more than `RENEW_WINDOW_DAYS` (7) left
  (`ALREADY_ACTIVE`). Needs phone (sandbox falls back to a dummy), creates the Cashfree order and a local
  `SubscriptionOrder`. Return URL is `/billing/return?order_id=…`, notify URL is the webhook.
- **`lib/billing.ts` is the single decision point**: `reconcileOrder(order)` asks Cashfree's API for the real
  order status (verifying amount + currency) and `applyPaidOrder` grants the plan idempotently (extends the
  pass if the same plan is still active, never downgrades, uses `appliedAt`). Both the webhook and
  `GET /api/billing/verify` call it, so they can't disagree.
- `POST /api/webhooks/cashfree`: the body is never trusted. The HMAC signature is computed and logged only
  (`signed`); the decision comes from `reconcileOrder`. A forged webhook can at most trigger a harmless lookup.
  Unknown orders are ignored with 200; errors return 500 so Cashfree retries.
- `GET /api/billing/verify?orderId=` is scoped to `{orderId, userId}` and reconciles on every poll.

### Cost tracking (`lib/cost.ts`)
Raw counts live on `InterviewSession.usage`; `estimateCost` prices them (turn model `gpt-4o-mini`, scoring
model from `usage.scoreModel`, Polly standard at $4/M chars). Edit prices in `lib/cost.ts` only.
`/api/tts` increments `usage.ttsCalls/ttsChars` when the client passes `sessionId`.

## Key conventions / gotchas

- **`@/*` path alias** maps to the repo root, e.g. `@/lib/mongodb`, `@/models/User`, `@/component/Header`.
- **Component folder is singular `component/`**, not `components/`.
- **Never trust client data for interview state.** Transcript, clock, turn caps, score and feedback are
  server-side. Don't add routes that accept feedback/score from the browser.
- **TTS engine**: `/api/tts` hardcodes `const engine = 'standard'`, ignoring the `engine` param, `pickEngine()`
  and `POLLY_ENGINE` (the client requests `"neural"`/voice `Raveena`, but standard is what's used; `pickEngine`
  is dead code). Cost estimates assume standard pricing.
- **Level strings**: `/api/create-interview` only accepts `easy|medium|hard`; `lib/prompts.ts`
  `normalizeLevel` also tolerates other text. `ClientInterview` defaults `level` to `"Junior"` if the URL
  param is missing.
- **Only DSA is offered** in the UI (`StartInterviewClient` hardcodes `technology: "dsa"`). `lib/constant.ts`
  `TECHNOLOGIES` and the language mapping in `ClientInterview.tsx` are broader than what's reachable.
- **Invite redemption** only allows users whose raw `plan` is `free` with no `subscriptionId`, so an expired trial
  user (still `plan: "pro"` in the DB) can't redeem another invite. The admin invite route ignores `campaign`/`notes`
  (not saved) and `NEXT_PUBLIC_APP_URL` has a trailing slash in `.env`, so route-built links get a double slash.
- **Buying during a trial**: buying Pro extends from the trial end (trial days are kept); buying Starter is blocked
  (`LOWER_PLAN`) until the trial ends.
- **Admin auth** (`lib/authz.ts`) compares the bearer token with `==`, not a constant-time compare.
- Several server routes read env with a trailing `!` and fail at request time if unset (`lib/mongodb.ts`,
  `lib/authz.ts`, `lib/cashfree.ts`, `api/interview/turn`, `lib/scoring.ts`).
- `api/feedback` opens its own `mongoose.connect(MONGODB_URI)` instead of using `connectToDB()`.
- Leftover debug `console.log`s exist in `create-interview`, `plan`, `user`, `share-public` and
  `getPromptsForInterview`; production builds strip them unless `KEEP_LOGS=1`.
- `instrumentation.ts` / `instrumentation.node.ts`: dev-only Windows workaround that points Node's DNS at
  8.8.8.8/1.1.1.1 when the resolver is loopback-only (fixes `mongodb+srv` `querySrv ECONNREFUSED`).
- `@supabase/supabase-js` is unused; don't assume Supabase backs anything.

## Commands

```bash
npm run dev     # next dev --turbopack
npm run build   # next build
npm run start   # next start (serve production build)
npm run lint    # next lint
```

There is no test suite configured. `lib/dashboard.ts` and parts of `lib/scoring.ts` are pure functions and
easy to unit-test if one is added.

## Working in this repo

- Edit the *live* interview implementation (`app/interview/ClientInterview.tsx`), not the dormant
  `hooks/useInterviewEngine.ts` / `component/interview/*`, unless explicitly asked to revive that refactor.
- Server routes consistently: check `auth()` first, validate content-type/body with `zod` (`.strict()` where
  the body is small and fixed), `connectToDB()`, scope Mongo queries by `userId` (never take a user id from
  the body), and return `{ error, code? }` JSON with an appropriate status. Follow this shape for new routes.
- Session-scoped queries filter by `{ _id: id, userId }` together — don't drop the `userId` scope.
- To add a new interview technology, extend `getPromptsForInterview` in `lib/prompts.ts` *and* update the
  scoring prompt/dimensions in `lib/scoring.ts` and `lib/dimensions.ts` (both are DSA-specific), and expose it
  in `StartInterviewClient`.
- To change scoring vocabulary or dimensions, remember stored sessions keep their old keys (see Scoring).
- Paid-plan logic goes through `effectivePlanId` and `lib/billing.ts`; don't upgrade users anywhere else.
