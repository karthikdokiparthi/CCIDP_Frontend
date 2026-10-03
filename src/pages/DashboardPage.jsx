import { useEffect, useState } from 'react';
import { getDashboard } from '../api/admin';
import { extractError } from '../api/client';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { KpiCard } from '../components/KpiCard';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { RelativeTime } from '../components/RelativeTime';
import { StatBars } from '../components/StatBars';

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await getDashboard());
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  const system = data?.system || {};
  const security = data?.security || {};

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Directory, authentication, and recent security activity for this CCIDP instance."
      />
      <div className="kpi-grid">
        <KpiCard
          label="Users"
          value={system.totalUsers}
          hint={`${system.activeUsers ?? 0} active · ${system.lockedUsers ?? 0} locked`}
        />
        <KpiCard
          label="MFA enabled"
          value={system.mfaEnabledUsers}
          hint={`${system.mfaRequiredUsers ?? 0} required`}
        />
        <KpiCard
          label="Applications"
          value={system.totalClients}
          hint={`${system.activeClients ?? 0} active`}
        />
        <KpiCard
          label="Sessions"
          value={system.activeSessions}
          hint={`${system.revokedSessions ?? 0} revoked`}
        />
      </div>
      <div className="kpi-grid">
        <KpiCard label="Login success (24h)" value={security.loginSuccess} />
        <KpiCard label="Login failure (24h)" value={security.loginFailure} />
        <KpiCard label="MFA success (24h)" value={security.mfaSuccess} />
        <KpiCard label="MFA failure (24h)" value={security.mfaFailure} />
      </div>
      <StatBars
        title="Security activity (24h)"
        items={[
          { label: 'Login success', value: security.loginSuccess, tone: 'is-success' },
          { label: 'Login failure', value: security.loginFailure, tone: 'is-danger' },
          { label: 'MFA success', value: security.mfaSuccess, tone: 'is-info' },
          { label: 'MFA failure', value: security.mfaFailure, tone: 'is-warning' },
        ]}
      />
      <div className="panel">
        <div className="panel-pad">
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>Recent audit events</h2>
          <p className="muted" style={{ marginTop: 4 }}>
            Latest identity events recorded by CCIDP.
          </p>
        </div>
        <DataTable
          rows={data?.recentEvents || []}
          emptyTitle="No recent events"
          emptyDescription="Audit activity will appear here after authentication events occur."
          columns={[
            {
              key: 'createdAt',
              header: 'Time',
              render: (row) => <RelativeTime value={row.createdAt} />,
            },
            { key: 'eventType', header: 'Event', render: (row) => row.eventType },
            {
              key: 'outcome',
              header: 'Outcome',
              render: (row) => <StatusBadge value={row.outcome} />,
            },
            { key: 'principal', header: 'Principal' },
            { key: 'ipAddress', header: 'IP', render: (row) => <span className="mono">{row.ipAddress || '—'}</span> },
            { key: 'detail', header: 'Detail', render: (row) => row.detail || '—' },
          ]}
        />
      </div>
    </>
  );
}
