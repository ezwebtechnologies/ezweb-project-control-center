export const SESSION_COOKIE = "ezweb_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function getAuthSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) {
    throw new Error(
      "AUTH_SECRET is required. Add it to .env (see .env.example)."
    );
  }
  return new TextEncoder().encode(raw);
}
