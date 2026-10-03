import { formatNumber } from '../utils/format';

export function KpiCard({ label, value, hint }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{formatNumber(value)}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}
