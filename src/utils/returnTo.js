const PUBLIC_PREFIXES = ['/login', '/forgot-password', '/reset-password', '/signup'];

export function isSafeReturnPath(path) {
  if (!path || typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return false;
  }
  return !PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function pathFromLocation(location) {
  if (!location) return '';
  if (typeof location === 'string') return location;
  return `${location.pathname || ''}${location.search || ''}`;
}
