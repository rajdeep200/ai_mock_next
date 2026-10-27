// lib/dimensions.ts
// The six skills every interview is scored on. Kept free of server-only imports so the dashboard (client) can use it.
export const DIMENSIONS = [
  { key: "understanding", label: "Problem understanding & clarifying questions", short: "Understanding", weight: 15 },
  { key: "approach", label: "Approach & correctness", short: "Approach", weight: 30 },
  { key: "complexity", label: "Complexity analysis", short: "Complexity", weight: 20 },
  { key: "code", label: "Code quality & implementation", short: "Code", weight: 15 },
  { key: "edge_cases", label: "Edge cases & testing", short: "Edge cases", weight: 10 },
  { key: "communication", label: "Communication", short: "Communication", weight: 10 },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]["key"];
