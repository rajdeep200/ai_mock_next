import dns from "dns";

const isLoopback = (s: string) => s === "127.0.0.1" || s === "::1";

// Dev-only workaround: on some Windows setups Node's resolver (c-ares) finds no usable DNS server and
// falls back to 127.0.0.1, where nothing listens. `mongodb+srv://` needs an SRV lookup through that
// resolver, so every Mongo-backed API route fails with `querySrv ECONNREFUSED`. In that case only,
// point Node at public DNS. OS-level lookups (fetch, etc.) are unaffected, and production is untouched.
// `dns.promises` (used by the MongoDB driver) keeps its own server list, so both are set.
export function fixLoopbackDns() {
  if (process.env.NODE_ENV !== "development") return;

  const servers = [...dns.getServers(), ...dns.promises.getServers()];
  if (!servers.length || !servers.every(isLoopback)) return;

  const publicDns = ["8.8.8.8", "1.1.1.1"];
  dns.setServers(publicDns);
  dns.promises.setServers(publicDns);
  console.warn("[dns] Node resolver was pointing at loopback; using 8.8.8.8/1.1.1.1 for this dev server.");
}
