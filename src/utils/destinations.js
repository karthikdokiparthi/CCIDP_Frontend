export const SETTINGS_PATH = '/account';

export const DESTINATIONS = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', hint: 'Overview and recent audit', adminOnly: true },
  { to: '/users', label: 'Users', icon: 'users', hint: 'Directory and account status', adminOnly: true },
  { to: '/roles', label: 'Roles', icon: 'roles', hint: 'Role catalog', adminOnly: true },
  { to: '/permissions', label: 'Permissions', icon: 'permissions', hint: 'Permission catalog', adminOnly: true },
  { to: '/applications', label: 'Applications', icon: 'apps', hint: 'OAuth clients', adminOnly: true },
  { to: '/sessions', label: 'Sessions', icon: 'sessions', hint: 'Active and revoked sessions', adminOnly: true },
  { to: '/audit', label: 'Audit', icon: 'audit', hint: 'Identity events', adminOnly: true },
  { to: '/system', label: 'System', icon: 'system', hint: 'Health and stats', adminOnly: true },
  { to: SETTINGS_PATH, label: 'Settings', icon: 'account', hint: 'Your password, MFA, and sessions', adminOnly: false },
];

export function normalizeRoles(roles) {
  if (!Array.isArray(roles)) return [];
  return roles.map((role) => String(role).trim().toUpperCase()).filter(Boolean);
}

export function hasDirectoryAdminRole(user) {
  const roles = normalizeRoles(user?.roles);
  return roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
}

export function visibleDestinations(user) {
  if (hasDirectoryAdminRole(user)) {
    return DESTINATIONS;
  }
  return DESTINATIONS.filter((item) => !item.adminOnly);
}

export function isSettingsPath(pathname) {
  return pathname === SETTINGS_PATH || pathname.startsWith(`${SETTINGS_PATH}/`);
}

export function homePath(user) {
  return hasDirectoryAdminRole(user) ? '/' : SETTINGS_PATH;
}

export function allowedAppPath(user, path) {
  if (!path || typeof path !== 'string') {
    return homePath(user);
  }
  const pathname = path.split('?')[0];
  if (hasDirectoryAdminRole(user)) {
    return path;
  }
  if (isSettingsPath(pathname)) {
    return path;
  }
  return SETTINGS_PATH;
}
