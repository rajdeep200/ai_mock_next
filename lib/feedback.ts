// lib/feedback.ts
// The stored feedback text is "Label:" sections (see lib/scoring.ts). Pull out the ones the pages show.
// Pure and client-safe.

export type ParsedFeedback = { summary: string; strengths: string[]; improvements: string[]; next: string };

export function parseFeedback(text: string | null | undefined): ParsedFeedback {
  const out: ParsedFeedback = { summary: "", strengths: [], improvements: [], next: "" };
  if (!text) return out;

  const labels: [keyof ParsedFeedback, RegExp][] = [
    ["summary", /^Overall Summary:\s*$/i],
    ["strengths", /^Strengths:\s*$/i],
    ["improvements", /^Areas for Improvement:\s*$/i],
    ["next", /^Next Steps:\s*$/i],
  ];
  const buckets: Record<keyof ParsedFeedback, string[]> = { summary: [], strengths: [], improvements: [], next: [] };

  let current: keyof ParsedFeedback | null = null;
  for (const line of text.split(/\r?\n/)) {
    const hit = labels.find(([, re]) => re.test(line.trim()));
    if (hit) { current = hit[0]; continue; }
    if (/^(Preparation Percentage|Reason|Score breakdown):/i.test(line.trim())) { current = null; continue; }
    if (current && line.trim()) buckets[current].push(line.trim());
  }

  const bullet = (l: string) => l.replace(/^[-•*]\s*/, "");
  out.summary = buckets.summary.join(" ");
  out.strengths = buckets.strengths.map(bullet);
  out.improvements = buckets.improvements.map(bullet);
  out.next = buckets.next.map(bullet).join(" ");
  return out;
}
