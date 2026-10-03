export const BRIGHTGRID_EMAIL_PATTERN =
  '[^@\\s]+@([Bb][Rr][Ii][Gg][Hh][Tt][Gg][Rr][Ii][Dd]|[Nn][Cc][Cc][Ll][Tt][Dd])\\.[Ii][Nn]';
export const BRIGHTGRID_EMAIL_MESSAGE = 'Use a company email (@brightgrid.in or @nccltd.in)';

export function isBrightGridEmail(email) {
  return /^[^\s@]+@(brightgrid|nccltd)\.in$/i.test(String(email || '').trim());
}
