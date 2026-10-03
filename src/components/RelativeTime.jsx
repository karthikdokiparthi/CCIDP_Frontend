import { formatExactLocal, formatRelative } from '../utils/format';

export function RelativeTime({ value }) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return (
    <time className="mono" dateTime={date.toISOString()} title={formatExactLocal(value)}>
      {formatRelative(value)}
    </time>
  );
}
