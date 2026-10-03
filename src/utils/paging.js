export const PAGE_SIZES = [10, 20, 50];

export function normalizePageSize(value) {
  const size = Number(value);
  return PAGE_SIZES.includes(size) ? size : 20;
}
