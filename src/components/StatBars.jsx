export function StatBars({ title = 'Last 24 hours', items = [] }) {
  const max = Math.max(1, ...items.map((item) => Number(item.value) || 0));

  return (
    <div className="panel chart-panel">
      <div className="panel-pad">
        <h2 className="panel-heading">{title}</h2>
        <p className="muted">Authentication outcomes recorded in the current window.</p>
        <div className="stat-bars">
          {items.map((item) => {
            const value = Number(item.value) || 0;
            const width = Math.max(value > 0 ? 2 : 0, Math.round((value / max) * 100));
            return (
              <div className="stat-bar-row" key={item.label}>
                <div className="stat-bar-label">{item.label}</div>
                <div className="stat-bar-track">
                  <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                    <rect className="stat-bar-bg" x="0" y="0" width="100" height="8" rx="2" />
                    <rect
                      className={`stat-bar-fill ${item.tone || ''}`}
                      x="0"
                      y="0"
                      width={width}
                      height="8"
                      rx="2"
                    />
                  </svg>
                </div>
                <div className="stat-bar-value mono">{value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
