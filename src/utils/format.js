export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return (
    new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(date) + ' UTC'
  );
}

export function formatExactLocal(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

export function formatRelative(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const abs = Math.abs(diffMs);
  const future = diffMs < 0;
  const suffix = future ? '' : ' ago';
  const prefix = future ? 'in ' : '';

  if (abs < 45 * 1000) return 'just now';
  if (abs < 60 * 60 * 1000) {
    const mins = Math.max(1, Math.round(abs / 60000));
    return `${prefix}${mins}m${suffix}`;
  }
  if (abs < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.round(abs / 3600000));
    return `${prefix}${hours}h${suffix}`;
  }
  if (abs < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.max(1, Math.round(abs / 86400000));
    return `${prefix}${days}d${suffix}`;
  }
  return formatDateTime(value);
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

export function displayName(user) {
  if (!user) return 'Unknown';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.username || 'Unknown';
}

export function initials(user) {
  if (!user) return '?';
  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  return (user.username || '?').slice(0, 2).toUpperCase();
}

export function shortId(value) {
  if (!value) return '—';
  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 8)}…` : text;
}

export function linesToSet(text) {
  if (!text || !text.trim()) return undefined;
  return text
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function setToLines(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.join('\n');
  if (value instanceof Set) return [...value].join('\n');
  return String(value);
}

export function toUriList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value instanceof Set) {
    return [...value].map((item) => String(item).trim()).filter(Boolean);
  }
  return linesToSet(String(value)) || [];
}

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}
