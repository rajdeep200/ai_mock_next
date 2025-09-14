// app/blog/top-50-most-common-dsa-interview-questions-and-patterns/page.tsx
import Script from "next/script";
import type { Metadata } from "next";

/** ─────────── THEME (black bg friendly) ─────────── */
const TEXT = "#E6F6EC";
const TEXT_MUTED = "#A7CDB8";
const HEADING = "#F1FFF7";
const CODE_BG = "#0B1020";
const CODE_TEXT = "#E7F5FF";
const HR = "#132019";
const ACCENT = "#22C55E";
const ACCENT_HOVER = "#16A34A";

/** ─────────── Tiny presentational components (server-safe) ─────────── */
function CTA({
  label,
  href,
  variant = "primary",
}: {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    padding: "10px 16px",
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid transparent",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
  };
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: ACCENT, color: "#06260F" },
    secondary: { background: "#0F1512", color: TEXT, borderColor: "#1C2A22" },
    ghost: { background: "transparent", color: ACCENT, borderColor: ACCENT },
  };
  return (
    <a href={href} style={{ ...base, ...(styles[variant] || styles.primary) }}>
      {label}
    </a>
  );
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: "1.25rem 0",
        borderRadius: 16,
        border: `1px solid #1C2A22`,
        background: "linear-gradient(180deg, rgba(34,197,94,0.05), rgba(34,197,94,0.02))",
        padding: 18,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8, color: ACCENT, letterSpacing: 0.2 }}>
        {title}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.7, color: TEXT }}>{children}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        border: `1px solid ${ACCENT}`,
        background: "rgba(34,197,94,0.12)",
        color: "#9BF2BA",
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

/** ─────────── SEO metadata ─────────── */
export const metadata: Metadata = {
  title: "Top 50 Most Common DSA Interview Questions & Patterns",
  description:
    "A practical, pattern-first guide to the 50 most common DSA interview questions—complete with Big-O hints, code snippets, rubrics, and a 7-day study plan.",
  keywords: [
    "DSA interview questions",
    "data structures and algorithms",
    "coding interview prep",
    "algorithm patterns",
    "FAANG interview",
    "mock interviews",
  ],
  alternates: {
    canonical:
      "https://www.mockqube.com/blog/top-50-most-common-dsa-interview-questions-and-patterns",
  },
  openGraph: {
    type: "article",
    url: "https://www.mockqube.com/blog/top-50-most-common-dsa-interview-questions-and-patterns",
    title: "Top 50 Most Common DSA Interview Questions & Patterns",
    description:
      "Pattern-first list of the 50 most common DSA interview questions—plus Big-O hints, code, rubrics, and a 7-day plan.",
    images: [
      {
        url: "https://www.mockqube.com/og/dsa-top-50.png",
        width: 1200,
        height: 630,
        alt: "Top 50 DSA Interview Questions – MockQube",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top 50 Most Common DSA Interview Questions & Patterns",
    description:
      "Pattern-first list of the 50 most common DSA interview questions—plus Big-O hints, code, rubrics, and a 7-day plan.",
    images: ["https://www.mockqube.com/og/dsa-top-50.png"],
    site: "@mockqube",
    creator: "@mockqube",
  },
  authors: [{ name: "MockQube Team", url: "https://www.mockqube.com/why-mockqube" }],
};

/** ─────────── Page ─────────── */
export default function Page() {
  const updated = "2025-09-14";

  return (
    <article
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "2.25rem 1rem 3rem",
        lineHeight: 1.8,
        color: TEXT,
      }}
    >
      {/* server-safe CSS for links (no JSX styles) */}
      <style>{`
        a.blog-link { color: #5BE08E; text-decoration: underline; }
        a.blog-link:hover { color: #89F0B0; }
        .kbd {
          padding: 2px 6px;
          border-radius: 6px;
          border: 1px solid #1C2A22;
          background: #0F1512;
          color: ${TEXT};
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 12px;
        }
      `}</style>

      {/* JSON-LD: BlogPosting */}
      <Script
        id="post-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: "Top 50 Most Common DSA Interview Questions & Patterns",
            description:
              "A pattern-first guide to the 50 most common DSA interview questions with Big-O hints, code, rubrics, and a 7-day plan.",
            datePublished: updated,
            dateModified: updated,
            author: { "@type": "Organization", name: "MockQube" },
            publisher: {
              "@type": "Organization",
              name: "MockQube",
              logo: { "@type": "ImageObject", url: "https://www.mockqube.com/logo.png" },
            },
            image: "https://www.mockqube.com/og/dsa-top-50.png",
            mainEntityOfPage:
              "https://www.mockqube.com/blog/top-50-most-common-dsa-interview-questions-and-patterns",
          }),
        }}
      />

      {/* JSON-LD: Breadcrumbs */}
      <Script
        id="breadcrumbs-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.mockqube.com/" },
              { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.mockqube.com/blog" },
              {
                "@type": "ListItem",
                position: 3,
                name: "Top 50 Most Common DSA Interview Questions & Patterns",
              },
            ],
          }),
        }}
      />

      {/* Title + meta */}
      <h1
        style={{
          fontSize: 34,
          fontWeight: 900,
          lineHeight: 1.2,
          marginBottom: 8,
          color: HEADING,
        }}
      >
        Top 50 Most Common DSA Interview Questions &amp; Patterns
      </h1>

      <div style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 16 }}>
        Last updated: <time dateTime={updated}>September 14, 2025</time> · ~12 min read
      </div>

      <p style={{ margin: "12px 0 20px" }}>
        <CTA
          label="Start a free mock interview"
          href="/start-interview"
        />
      </p>

      {/* Summary */}
      <p>
        <strong>Summary:</strong> This guide focuses on <strong>patterns</strong> (sliding window,
        two pointers, hashing, stacks, binary search, trees, graphs, heaps/greedy, DP) and maps them
        to the <strong>50 most common DSA interview questions</strong>. You’ll get{" "}
        <strong>Big-O hints</strong>, compact <strong>code snippets</strong>, an{" "}
        <strong>evaluation rubric</strong>, and a <strong>7-day plan</strong> to convert studying
        into results.
      </p>

      <Callout title="Table of Contents">
        <ol>
          <li>
            <a className="blog-link" href="#key-takeaways">
              Key takeaways
            </a>
          </li>
          <li>
            <a className="blog-link" href="#patterns-cheat-sheet">
              Patterns cheat sheet
            </a>
          </li>
          <li>
            <a className="blog-link" href="#arrays-sliding-window">
              Arrays & Sliding Window (1–12)
            </a>
          </li>
          <li>
            <a className="blog-link" href="#stack-monotonic">
              Stack & Monotonic Stack (13–18)
            </a>
          </li>
          <li>
            <a className="blog-link" href="#binary-search">
              Binary Search & Order Statistics (19–23)
            </a>
          </li>
          <li>
            <a className="blog-link" href="#hashing-prefix">
              Hashing & Prefix (24–27)
            </a>
          </li>
          <li>
            <a className="blog-link" href="#trees">
              Trees (28–33)
            </a>
          </li>
          <li>
            <a className="blog-link" href="#graphs">
              Graphs (34–39)
            </a>
          </li>
          <li>
            <a className="blog-link" href="#heaps-greedy">
              Heaps / Greedy / Intervals (40–44)
            </a>
          </li>
          <li>
            <a className="blog-link" href="#dynamic-programming">
              Dynamic Programming (45–50)
            </a>
          </li>
          <li>
            <a className="blog-link" href="#evaluation-rubric">
              Evaluation rubric
            </a>
          </li>
          <li>
            <a className="blog-link" href="#seven-day-plan">
              7-day plan
            </a>
          </li>
          <li>
            <a className="blog-link" href="#faq">
              FAQ
            </a>
          </li>
        </ol>
      </Callout>

      {/* Key takeaways */}
      <h2 id="key-takeaways" style={{ color: HEADING }}>Key takeaways</h2>
      <ul>
        <li>
          Think in <strong>patterns</strong>, not problems. Say your plan before coding.
        </li>
        <li>
          Always state <strong>time/space complexity</strong> and call out{" "}
          <strong>edge cases</strong>.
        </li>
        <li>
          Practice under a <strong>time box</strong> and narrate trade-offs as you work.
        </li>
        <li>
          Use a <strong>rubric</strong> (below) to simulate a real interview loop.
        </li>
      </ul>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Patterns cheat sheet */}
      <h2 id="patterns-cheat-sheet" style={{ color: HEADING }}>Patterns Cheat Sheet</h2>
      <ul>
        <li>
          <strong>Two Pointers / Sliding Window</strong> → subarray/substring, dedup,
          partitioning, min/max window
        </li>
        <li>
          <strong>Binary Search</strong> → sorted arrays, <em>monotonic answers</em>, answer-space
          search
        </li>
        <li>
          <strong>Hashing</strong> → lookups, frequency maps, de-duplication, prefix sums
        </li>
        <li>
          <strong>Stack / Monotonic Stack</strong> → NGE, parentheses, histogram
        </li>
        <li>
          <strong>Heap / Greedy</strong> → k-largest, scheduling, intervals
        </li>
        <li>
          <strong>Graph (BFS/DFS)</strong> → connectivity, shortest path (unweighted → BFS)
        </li>
        <li>
          <strong>Tree</strong> → DFS traversals + invariants
        </li>
        <li>
          <strong>DP</strong> → overlapping subproblems, optimal substructure
        </li>
        <li>
          <strong>Backtracking</strong> → combinations, permutations, subsets
        </li>
        <li>
          <strong>Bit/Math</strong> → parity, unique elements, gcd/lcm
        </li>
      </ul>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Arrays & Sliding Window (1–12) */}
      <h2 id="arrays-sliding-window" style={{ color: HEADING }}>
        1) Arrays &amp; Two Pointers / Sliding Window
      </h2>
      <ol>
        <li><strong>Two Sum</strong> (hash) — <em>O(n), O(n)</em></li>
        <li><strong>Best Time to Buy &amp; Sell Stock (I)</strong> — <em>O(n), O(1)</em></li>
        <li><strong>Maximum Subarray (Kadane)</strong> — <em>O(n), O(1)</em></li>
        <li><strong>Product of Array Except Self</strong> — <em>O(n), O(1)</em></li>
        <li><strong>Contains Duplicate</strong> (set) — <em>O(n), O(n)</em></li>
        <li><strong>Valid Anagram</strong> — <em>O(n), O(Σ)</em></li>
        <li><strong>Longest Substring Without Repeating</strong> — <em>O(n), O(Σ)</em></li>
        <li><strong>Minimum Window Substring</strong> — <em>O(n), O(Σ)</em></li>
        <li><strong>3Sum</strong> (sort+two pointers) — <em>O(n²), O(1)</em></li>
        <li><strong>Container With Most Water</strong> — <em>O(n), O(1)</em></li>
        <li><strong>Dutch National Flag</strong> — <em>O(n), O(1)</em></li>
        <li><strong>Merge Intervals</strong> — <em>O(n log n), O(n)</em></li>
      </ol>

      <p><strong>Example — Longest Substring Without Repeating</strong></p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: CODE_BG,
          color: CODE_TEXT,
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {`function lengthOfLongestSubstring(s: string): number {
  const seen = new Map<string, number>();
  let left = 0, ans = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (seen.has(ch) && seen.get(ch)! >= left) left = seen.get(ch)! + 1;
    seen.set(ch, right);
    ans = Math.max(ans, right - left + 1);
  }
  return ans;
}
// Time: O(n) | Space: O(min(n, Σ))`}
      </pre>

      <p style={{ margin: "12px 0 20px" }}>
        <CTA
          variant="secondary"
          label="Practice these now on MockQube"
          href="/start-interview"
        />
      </p>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Stack & Monotonic (13–18) */}
      <h2 id="stack-monotonic" style={{ color: HEADING }}>
        2) Stack &amp; Monotonic Stack
      </h2>
      <ol start={13}>
        <li>Valid Parentheses — <em>O(n), O(n)</em></li>
        <li>Min Stack — O(1) ops</li>
        <li>Daily Temperatures — <em>O(n), O(n)</em></li>
        <li>Next Greater Element — <em>O(n), O(n)</em></li>
        <li>Largest Rectangle in Histogram — <em>O(n), O(n)</em></li>
        <li>Evaluate Reverse Polish Notation — <em>O(n), O(n)</em></li>
      </ol>

      <p><strong>Example — Valid Parentheses</strong></p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: CODE_BG,
          color: CODE_TEXT,
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {`function isValid(s: string): boolean {
  const st: string[] = [];
  const pair: Record<string,string> = {")":"(","]":"[","}":"{"};
  for (const ch of s) {
    if (ch in pair) {
      if (st.pop() !== pair[ch]) return false;
    } else {
      st.push(ch);
    }
  }
  return st.length === 0;
}`}
      </pre>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Binary Search (19–23) */}
      <h2 id="binary-search" style={{ color: HEADING }}>
        3) Binary Search &amp; Order Statistics
      </h2>
      <ol start={19}>
        <li>Binary Search — <em>O(log n)</em></li>
        <li>Search in Rotated Sorted Array — <em>O(log n)</em></li>
        <li>Find Kth Smallest/Largest (Quickselect) — avg <em>O(n)</em></li>
        <li>Answer-space BS (Koko/Ship Capacity) — <em>O(n log A)</em></li>
        <li>Median of Two Sorted Arrays — <em>O(log(min(m,n)))</em></li>
      </ol>

      <p><strong>Example — Answer-space Binary Search</strong></p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: CODE_BG,
          color: CODE_TEXT,
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {`function feasible(mid: number, arr: number[], h: number): boolean {
  let hours = 0;
  for (const x of arr) hours += Math.ceil(x / mid);
  return hours <= h;
}
function minEatingSpeed(piles: number[], h: number): number {
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    feasible(mid, piles, h) ? hi = mid : lo = mid + 1;
  }
  return lo;
}`}
      </pre>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Hashing & Prefix (24–27) */}
      <h2 id="hashing-prefix" style={{ color: HEADING }}>
        4) Hashing &amp; Prefix
      </h2>
      <ol start={24}>
        <li>Subarray Sum Equals K — <em>O(n), O(n)</em></li>
        <li>Longest Consecutive Sequence — <em>O(n), O(n)</em></li>
        <li>Group Anagrams — <em>O(n·k log k)</em> or <em>O(n·k)</em></li>
        <li>Two Sum II (sorted) — <em>O(n), O(1)</em></li>
      </ol>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Trees (28–33) */}
      <h2 id="trees" style={{ color: HEADING }}>
        5) Trees (BST/BT) — DFS/BFS
      </h2>
      <ol start={28}>
        <li>Level Order (BFS) — <em>O(n), O(n)</em></li>
        <li>Max Depth (DFS) — <em>O(n)</em></li>
        <li>Validate BST (bounds) — <em>O(n)</em></li>
        <li>LCA (BST/BT) — <em>O(h)/O(n)</em></li>
        <li>Diameter — <em>O(n)</em></li>
        <li>Serialize/Deserialize — <em>O(n)</em></li>
      </ol>

      <p><strong>Example — Validate BST</strong></p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: CODE_BG,
          color: CODE_TEXT,
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {`type N = { val: number; left: N|null; right: N|null } | null;
function isValidBST(root: N, low: number = -Infinity, high: number = Infinity): boolean {
  if (!root) return true;
  if (root.val <= low || root.val >= high) return false;
  return isValidBST(root.left, low, root.val) && isValidBST(root.right, root.val, high);
}`}
      </pre>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Graphs (34–39) */}
      <h2 id="graphs" style={{ color: HEADING }}>
        6) Graphs — BFS/DFS/Toposort/Union-Find
      </h2>
      <ol start={34}>
        <li>Number of Islands — <em>O(mn)</em></li>
        <li>Clone Graph — <em>O(V+E)</em></li>
        <li>Course Schedule (Kahn) — <em>O(V+E)</em></li>
        <li>Rotting Oranges — <em>O(mn)</em></li>
        <li>Pacific Atlantic — <em>O(mn)</em></li>
        <li>Accounts Merge (Union-Find) — ~<em>O(n)</em></li>
      </ol>

      <p><strong>Example — Course Schedule (Kahn)</strong></p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: CODE_BG,
          color: CODE_TEXT,
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {`function canFinish(n: number, prereq: number[][]): boolean {
  const indeg = Array(n).fill(0);
  const g: number[][] = Array.from({length:n},()=>[]);
  for (const [a,b] of prereq) { g[b].push(a); indeg[a]++; }
  const q: number[] = [];
  for (let i=0;i<n;i++) if (indeg[i]===0) q.push(i);
  let seen = 0;
  while (q.length) {
    const u = q.shift()!;
    seen++;
    for (const v of g[u]) if (--indeg[v]===0) q.push(v);
  }
  return seen === n;
}`}
      </pre>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Heaps / Greedy (40–44) */}
      <h2 id="heaps-greedy" style={{ color: HEADING }}>
        7) Heaps / Greedy / Intervals
      </h2>
      <ol start={40}>
        <li>Kth Largest — heap <em>O(n log k)</em></li>
        <li>Top K Frequent — heap/bucket <em>O(n log k)/O(n)</em></li>
        <li>Task Scheduler — <em>O(n)</em></li>
        <li>Meeting Rooms II — <em>O(n log n)</em></li>
        <li>Merge K Sorted Lists — <em>O(n log k)</em></li>
      </ol>

      <p><strong>Example — Min-Heap sketch</strong></p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: CODE_BG,
          color: CODE_TEXT,
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {`class MinHeap {
  private a: number[] = [];
  private up(i:number){while(i>0){const p=(i-1)>>1;if(this.a[p]<=this.a[i])break;[this.a[p],this.a[i]]=[this.a[i],this.a[p]];i=p;}}
  private down(i:number){const n=this.a.length;while(true){let s=i,l=i*2+1,r=l+1;if(l<n&&this.a[l]<this.a[s])s=l;if(r<n&&this.a[r]<this.a[s])s=r;if(s===i)break;[this.a[s],this.a[i]]=[this.a[i],this.a[s]];i=s;}}
  push(x:number){this.a.push(x);this.up(this.a.length-1);}
  pop(){const n=this.a.length;[this.a[0],this.a[n-1]]=[this.a[n-1],this.a[0]];const v=this.a.pop();this.down(0);return v;}
  top(){return this.a[0];}
  size(){return this.a.length;}
}
function findKthLargest(nums:number[], k:number): number {
  const h=new MinHeap();
  for(const x of nums){h.push(x); if(h.size()>k) h.pop();}
  return h.top();
}`}
      </pre>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* DP (45–50) */}
      <h2 id="dynamic-programming" style={{ color: HEADING }}>
        8) Dynamic Programming
      </h2>
      <ol start={45}>
        <li>Climbing Stairs — <em>O(n), O(1)</em></li>
        <li>House Robber I/II — <em>O(n), O(1)</em></li>
        <li>Coin Change — <em>O(amount·n)</em></li>
        <li>Longest Increasing Subsequence — <em>O(n log n)</em></li>
        <li>Edit Distance — <em>O(mn)</em></li>
        <li>0/1 Knapsack — <em>O(nW)</em></li>
      </ol>

      <p><strong>Example — Coin Change</strong></p>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: CODE_BG,
          color: CODE_TEXT,
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {`function coinChange(coins: number[], amount: number): number {
  const dp = Array(amount+1).fill(Infinity);
  dp[0] = 0;
  for (const c of coins) {
    for (let a = c; a <= amount; a++) {
      dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`}
      </pre>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* Rubric */}
      <h2 id="evaluation-rubric" style={{ color: HEADING }}>
        Evaluation Rubric (what interviewers look for)
      </h2>
      <ul>
        <li>
          <strong>Pattern ID:</strong> Map problem to a known pattern.
        </li>
        <li>
          <strong>Complexity:</strong> State time/space + trade-offs.
        </li>
        <li>
          <strong>Edge cases:</strong> Empty, duplicates, negatives, large sizes.
        </li>
        <li>
          <strong>Testing:</strong> 3+ cases before/after coding.
        </li>
        <li>
          <strong>Clarity:</strong> Names, helpers, invariants.
        </li>
        <li>
          <strong>Communication:</strong> Think-aloud; clarify constraints.
        </li>
      </ul>

      <p style={{ marginTop: "0.75rem" }}>
        <Badge>Pro tip</Badge>&nbsp; Use <span className="kbd">15–30m</span> sprints. If stuck ~2
        minutes, shrink the example or consider an alternative pattern.
      </p>

      <p style={{ margin: "12px 0 20px" }}>
        <CTA
          label="Try a timed mock interview → Free"
          href="/start-interview"
        />
      </p>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* 7-day plan */}
      <h2 id="seven-day-plan" style={{ color: HEADING }}>
        Suggested Practice Flow (7-Day Plan)
      </h2>
      <p>
        <strong>Day 1:</strong> Arrays + Sliding Window (Q1–Q12) <br />
        <strong>Day 2:</strong> Stack + Monotonic Stack (Q13–Q18) <br />
        <strong>Day 3:</strong> Binary Search + Hashing (Q19–Q27) <br />
        <strong>Day 4:</strong> Trees (Q28–Q33) <br />
        <strong>Day 5:</strong> Graphs (Q34–Q39) <br />
        <strong>Day 6:</strong> Heaps/Greedy (Q40–Q44) <br />
        <strong>Day 7:</strong> Dynamic Programming (Q45–Q50) + full mock
      </p>

      <Callout title="Want feedback like a real interviewer?">
        MockQube gives rubric-based coaching on solution approach, code quality, and communication—mirroring real loops.
      </Callout>

      <p>
        <CTA
          label="Start your first mock now"
          href="/start-interview"
        />
      </p>

      <hr style={{ borderColor: HR, opacity: 0.6 }} />

      {/* JSON-LD: FAQPage */}
      <h2 id="faq" style={{ color: HEADING, marginTop: 24 }}>FAQ</h2>
      <Script
        id="faq-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What’s the most important part of a DSA interview?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Pattern recognition and communication. State your plan, justify the data structure, and give time/space before coding.",
                },
              },
              {
                "@type": "Question",
                name: "How many problems should I practice daily?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Quality over quantity. Aim for 3–5 focused problems across 1–2 patterns and review mistakes deeply.",
                },
              },
              {
                "@type": "Question",
                name: "How do I simulate a realistic interview?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Use a 30–45 minute timed session, think-aloud, and use a rubric. Then review with a mentor or MockQube.",
                },
              },
              {
                "@type": "Question",
                name: "I’m weak at DP—where do I start?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Start with Climbing Stairs, House Robber, and Coin Change. Define state, transitions, and base cases.",
                },
              },
              {
                "@type": "Question",
                name: "What should I do after solving?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text:
                    "Write down pattern, invariants, and edge cases you missed. Re-solve after 48 hours without looking.",
                },
              },
            ],
          }),
        }}
      />

      <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 12 }}>
        Continue learning:{" "}
        <a className="blog-link" href="/blog/what-is-mockqube">
          What is MockQube
        </a>{" "}
        ·{" "}
        <a className="blog-link" href="/pricing">
          Pricing
        </a>
        {/* <a className="blog-link" href="/blog">
          More blog posts
        </a> */}
      </p>
    </article>
  );
}
