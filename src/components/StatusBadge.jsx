export function StatusBadge({ value }) {
  const key = String(value || '').toUpperCase();
  const map = {
    ACTIVE: 'badge-success',
    SUCCESS: 'badge-success',
    ENABLED: 'badge-success',
    UP: 'badge-success',
    INACTIVE: 'badge-neutral',
    DISABLED: 'badge-neutral',
    UNKNOWN: 'badge-warning',
    LOCKED: 'badge-warning',
    SUSPENDED: 'badge-danger',
    REVOKED: 'badge-danger',
    FAILURE: 'badge-danger',
    DOWN: 'badge-danger',
    OUT_OF_SERVICE: 'badge-danger',
    CONFIDENTIAL: 'badge-info',
    PUBLIC: 'badge-neutral',
    EMPLOYEE: 'badge-neutral',
    ADMIN: 'badge-info',
    SERVICE: 'badge-warning',
  };
  return <span className={`badge ${map[key] || 'badge-neutral'}`}>{key || '—'}</span>;
}

export function MfaBadge({ enabled, required }) {
  if (enabled) {
    return <span className="badge badge-success">MFA on</span>;
  }
  if (required) {
    return <span className="badge badge-warning">MFA required</span>;
  }
  return <span className="badge">MFA off</span>;
}
