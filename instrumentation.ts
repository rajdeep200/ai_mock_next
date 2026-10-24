// Runs once when the Next.js server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { fixLoopbackDns } = await import("./instrumentation.node");
    fixLoopbackDns();
  }
}
