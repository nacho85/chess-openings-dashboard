export function isAdminRequest(req) {
  const cookie = req.headers.get("cookie") || "";
  const secret = process.env.ADMIN_SECRET;

  if (!secret) return false;

  return cookie.includes(`opening_admin=${secret}`);
}