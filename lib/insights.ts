// lib/insights.ts
// The fixed vocabulary the scorer tags each interview with, so habits can be counted across interviews
// ("no complexity analysis in 6 of 8"). Free-form text can't be counted; these keys can.
// Keys are stored in the database: add new ones freely, but don't rename or reuse a key (bump INSIGHTS_VERSION
// if the meaning of existing keys changes). Labels are what the dashboard shows.

export const INSIGHTS_VERSION = 1;

export const STRENGTH_TAGS = [
  { key: "clarifying_questions", label: "Asks clarifying questions up front", hint: "asked about constraints, inputs or edge conditions before solving" },
  { key: "stepwise_approach", label: "Explains the approach step by step", hint: "laid out a clear plan before writing code" },
  { key: "brute_force_first", label: "Starts simple, then optimises", hint: "gave a basic solution first and then improved it" },
  { key: "optimised_solution", label: "Improves the solution's efficiency", hint: "reduced time or space complexity from the first idea" },
  { key: "stated_complexity", label: "States time and space complexity unprompted", hint: "gave correct time and space complexity BEFORE the interviewer asked; if the interviewer had to ask for it, do not use this key (use no_complexity_analysis instead)" },
  { key: "handles_edge_cases", label: "Considers edge cases on their own", hint: "raised tricky inputs BEFORE the interviewer asked; if prompted, do not use this key" },
  { key: "tested_code", label: "Tests the code with examples", hint: "dry-ran or tested the solution before calling it done" },
  { key: "clean_code", label: "Writes clear, readable code", hint: "sensible names and structure" },
  { key: "thinks_aloud", label: "Thinks out loud", hint: "the interviewer could follow the reasoning as it happened" },
  { key: "uses_hints_well", label: "Recovers well after a hint", hint: "took a nudge and moved forward quickly" },
  { key: "discusses_tradeoffs", label: "Discusses trade-offs", hint: "compared approaches and explained the choice" },
  { key: "self_corrects", label: "Catches and fixes their own mistakes", hint: "spotted a bug or wrong turn without the interviewer pointing it out" },
  { key: "handles_followups", label: "Handles follow-up questions well", hint: "answered 'can you do better?' or variation questions with a sound idea" },
] as const;

export const ISSUE_TAGS = [
  { key: "no_clarifying_questions", label: "Doesn't ask clarifying questions", hint: "started solving without checking the problem details" },
  { key: "coded_before_plan", label: "Starts coding before agreeing on an approach", hint: "wrote code without explaining the plan first" },
  { key: "brute_force_only", label: "Stops at the brute-force solution", hint: "did not look for a better approach, even when pushed" },
  { key: "no_complexity_analysis", label: "Doesn't state complexity unless asked", hint: "the candidate did not give complexity until the interviewer asked for it, or never gave it" },
  { key: "wrong_complexity", label: "Gets the complexity wrong", hint: "stated an incorrect time or space complexity" },
  { key: "no_edge_cases", label: "Doesn't consider edge cases", hint: "never raised empty, single-item, duplicate or extreme inputs, even when asked" },
  { key: "no_dry_run", label: "Doesn't walk through the code on an example", hint: "called the solution done without tracing it on an input" },
  { key: "bugs_in_code", label: "Code has bugs", hint: "the written solution had errors the candidate did not catch" },
  { key: "messy_code", label: "Code is hard to read", hint: "unclear names or tangled structure" },
  { key: "unclear_explanation", label: "Explanations are hard to follow", hint: "reasoning was vague, jumbled or skipped steps" },
  { key: "ignored_feedback", label: "Doesn't act on hints or corrections", hint: "kept going the same way after the interviewer redirected" },
  { key: "gives_up_quickly", label: "Gives up too quickly", hint: "said they didn't know or were stuck without trying an idea" },
  { key: "poor_time_management", label: "Runs out of time on early steps", hint: "spent so long on one stage that coding or testing never happened" },
] as const;

export const TOPICS = [
  { key: "arrays", label: "Arrays" },
  { key: "strings", label: "Strings" },
  { key: "hashing", label: "Hash maps & sets" },
  { key: "two_pointers", label: "Two pointers" },
  { key: "sliding_window", label: "Sliding window" },
  { key: "binary_search", label: "Binary search" },
  { key: "sorting", label: "Sorting" },
  { key: "linked_list", label: "Linked lists" },
  { key: "stacks_queues", label: "Stacks & queues" },
  { key: "trees", label: "Trees" },
  { key: "graphs", label: "Graphs" },
  { key: "bfs", label: "BFS" },
  { key: "dfs", label: "DFS" },
  { key: "union_find", label: "Union-Find" },
  { key: "tries", label: "Tries" },
  { key: "intervals", label: "Intervals" },
  { key: "matrix", label: "Matrix & grids" },
  { key: "recursion_backtracking", label: "Recursion & backtracking" },
  { key: "dp", label: "Dynamic programming" },
  { key: "greedy", label: "Greedy" },
  { key: "heap", label: "Heaps" },
  { key: "math_bits", label: "Math & bits" },
  { key: "other", label: "Other" },
] as const;

/** Topics a candidate can pick on the start page ("other" is only a scoring label). */
export const FOCUS_TOPICS = TOPICS.filter((t) => t.key !== "other");
export const FOCUS_KEYS = FOCUS_TOPICS.map((t) => t.key) as [string, ...string[]];

/** How the start page groups the topic picker. Every focus topic must appear in exactly one group. */
export const FOCUS_GROUPS: { label: string; keys: readonly (typeof FOCUS_TOPICS)[number]["key"][] }[] = [
  { label: "Basics", keys: ["arrays", "strings", "hashing", "sorting", "binary_search"] },
  { label: "Pointers & windows", keys: ["two_pointers", "sliding_window", "intervals"] },
  { label: "Data structures", keys: ["linked_list", "stacks_queues", "trees", "heap", "tries", "matrix"] },
  { label: "Graphs", keys: ["graphs", "bfs", "dfs", "union_find"] },
  { label: "Techniques", keys: ["recursion_backtracking", "dp", "greedy", "math_bits"] },
];

/** Opposite pairs: if the model returns both, the evidence is unclear, so both are dropped. */
export const CONFLICTS: [StrengthKey, IssueKey][] = [
  ["clarifying_questions", "no_clarifying_questions"],
  ["stepwise_approach", "coded_before_plan"],
  ["optimised_solution", "brute_force_only"],
  ["stated_complexity", "no_complexity_analysis"],
  ["handles_edge_cases", "no_edge_cases"],
  ["tested_code", "no_dry_run"],
  ["clean_code", "messy_code"],
  ["uses_hints_well", "ignored_feedback"],
];

// Not tags on purpose: these are measured in code and stored as numbers on SessionInsights
// (hintsGiven >= 3 means "needed many hints"; silenceCheckins >= 1 means "went quiet"). 
// They are more reliable than asking the model to judge them.

export type StrengthKey = (typeof STRENGTH_TAGS)[number]["key"];
export type IssueKey = (typeof ISSUE_TAGS)[number]["key"];
export type TopicKey = (typeof TOPICS)[number]["key"];

export type TaggedEvidence<K extends string> = { tag: K; quote: string };

export type TimelineEntry = {
  fromMin: number;
  toMin: number;
  summary: string;
  kind: "good" | "neutral" | "bad";
};

/** Saved on the session (InterviewSession.insights) when the interview had enough content to assess. */
export type SessionInsights = {
  version: number;
  problem: { title: string; topic: TopicKey };
  strengths: TaggedEvidence<StrengthKey>[];
  issues: TaggedEvidence<IssueKey>[];
  timeline: TimelineEntry[];
  hintsGiven: number;
  silenceCheckins: number; // times the interviewer had to check in after a long silence
  doNextTime: string;
};

export const STRENGTH_KEYS = STRENGTH_TAGS.map((t) => t.key) as unknown as StrengthKey[];
export const ISSUE_KEYS = ISSUE_TAGS.map((t) => t.key) as unknown as IssueKey[];
export const TOPIC_KEYS = TOPICS.map((t) => t.key) as unknown as TopicKey[];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** True when the quote really appears in something the candidate said (ignoring case and punctuation). */
export function quoteIsGenuine(quote: string, candidateSpeech: string[]): boolean {
  const q = norm(quote);
  if (q.split(" ").length < 3) return false; // too short to mean anything
  return candidateSpeech.some((m) => norm(m).includes(q));
}

/** What to do about each recurring mistake: the "Instead" tip and the title of the matching practice step. */
export const ISSUE_FIX: Record<IssueKey | "many_hints" | "went_quiet", { title: string; tip: string }> = {
  no_clarifying_questions: { title: "Ask before you solve", tip: "Spend the first minute asking about input size, duplicates, sorted or not, and what to return when there is no answer." },
  coded_before_plan: { title: "Plan out loud before coding", tip: "Say your approach in 2 or 3 sentences and let the interviewer agree before you write the first line." },
  brute_force_only: { title: "Push past brute force", tip: "After the simple solution, ask yourself what work repeats, and look for a map, sort or two pointers to remove it." },
  no_complexity_analysis: { title: "Practice complexity analysis", tip: "As soon as you finish your approach, say \"this is O(n) time and O(n) space because…\" before you start coding." },
  wrong_complexity: { title: "Sharpen your complexity analysis", tip: "Count the loops and what each one touches, and remember that hash map and sort costs add up." },
  no_edge_cases: { title: "Build an edge-case habit", tip: "Before you say done, test an empty input, a single item, duplicates, and the largest input." },
  no_dry_run: { title: "Trace your code before finishing", tip: "Walk through your code line by line on a small example out loud, and watch for off-by-one mistakes." },
  bugs_in_code: { title: "Write cleaner first drafts", tip: "Code slowly from your plan, then re-read each line against your example to catch mistakes before the interviewer does." },
  messy_code: { title: "Write readable code", tip: "Use descriptive names, small helper steps and consistent structure, since an interviewer reads your code like a teammate would." },
  unclear_explanation: { title: "Make your explanations clearer", tip: "Use a simple shape: the idea, a small example, then the steps. Pause to check the interviewer is following." },
  ignored_feedback: { title: "Act on hints quickly", tip: "When the interviewer nudges you, repeat it back in your own words and try it right away, even if you're not sure." },
  gives_up_quickly: { title: "Keep trying when stuck", tip: "Instead of saying \"I don't know\", say what you do know and try the simplest idea, even if it is slow." },
  poor_time_management: { title: "Pace the interview", tip: "Aim for about 5 minutes to understand, 10 to plan, 15 to code and 5 to test, and move on when you are over." },
  many_hints: { title: "Rely less on hints", tip: "When stuck, talk through what you've tried and what would help before you ask for a nudge." },
  went_quiet: { title: "Think out loud", tip: "Even half-formed thoughts help: \"I'm considering a hash map, but checking if it fits…\"." },
};

/** Fallback advice per skill, used before there is enough tag data. */
export const SKILL_FIX: Record<string, { title: string; tip: string }> = {
  understanding: { title: "Understand the problem first", tip: "Restate the problem in your own words and ask about constraints before you start." },
  approach: { title: "Strengthen your approach", tip: "Start with a simple solution, say why it is slow, and look for the repeated work to remove." },
  complexity: ISSUE_FIX.no_complexity_analysis,
  code: { title: "Improve your code", tip: "Write from a clear plan, use meaningful names, and re-read your code before you finish." },
  edge_cases: ISSUE_FIX.no_edge_cases,
  communication: { title: "Communicate more clearly", tip: "Think out loud and structure explanations as idea, example, steps." },
};
