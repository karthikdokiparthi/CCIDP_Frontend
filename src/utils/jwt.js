export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function rolesFromAccessToken(token) {
  const payload = decodeJwtPayload(token);
  const raw = payload?.roles;
  if (!Array.isArray(raw)) return [];
  return raw.map((role) => String(role).trim().toUpperCase()).filter(Boolean);
}

export function getAccessTokenExpiryMs(token) {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp) || exp <= 0) return null;
  return exp * 1000;
}

export function isAccessTokenExpiring(token, skewMs = 60_000) {
  const expiry = getAccessTokenExpiryMs(token);
  if (!expiry) return false;
  return Date.now() >= expiry - skewMs;
}
