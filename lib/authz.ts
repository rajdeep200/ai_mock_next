export function requireAdminToken(req: Request) {
  const configured = process.env.ADMIN_API_TOKEN!;
  if (!configured) return false;

  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;

  const token = m[1].trim();
  return token.length > 0 && token == configured;
}
