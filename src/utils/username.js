export const USERNAME_PATTERN = '[A-Za-z0-9._-]{3,32}';
export const USERNAME_MESSAGE =
  'Username must be 3–32 characters and use only letters, digits, dots, underscores, or hyphens';

export function isValidUsername(username) {
  return /^[A-Za-z0-9._-]{3,32}$/.test(String(username || '').trim());
}
