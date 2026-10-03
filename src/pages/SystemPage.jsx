import { Fragment, useEffect, useState } from 'react';
import { getHealth, getOpenIdConfiguration, getSecurityStats, getSystemStats } from '../api/admin';
import { extractError } from '../api/client';
import { CopyableId } from '../components/CopyableId';
import { ErrorState } from '../components/ErrorState';
import { KpiCard } from '../components/KpiCard';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatNumber } from '../utils/format';

export function SystemPage() {
  const [system, setSystem] = useState(null);
  const [security, setSecurity] = useState(null);
  const [health, setHealth] = useState(null);
  const [discovery, setDiscovery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [sys, sec] = await Promise.all([getSystemStats(), getSecurityStats(24)]);
      setSystem(sys);
      setSecurity(sec);
      try {
        setHealth(await getHealth());
      } catch {
        setHealth({ status: 'DOWN' });
      }
      try {
        setDiscovery(await getOpenIdConfiguration());
      } catch {
        setDiscovery(null);
      }
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
    return <LoadingState label="Loading system status" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  const components = health?.components
    ? Object.entries(health.components)
    : [];

  return (
    <>
      <PageHeader
        title="System"
        description="Instance health, directory inventory, and authentication activity for the last 24 hours."
        actions={
          <button className="btn" type="button" onClick={load}>
            Refresh
          </button>
        }
      />

      <section className="panel panel-pad" style={{ marginBottom: 16 }}>
        <div className="health-row">
          <div>
            <h2 className="panel-heading">Runtime health</h2>
            <p className="muted">Spring Actuator health via VITE_API_BASE_URL (default /ccidp/actuator/health).</p>
          </div>
          <StatusBadge value={health?.status || 'UNKNOWN'} />
        </div>
        {components.length ? (
          <dl className="dl" style={{ marginTop: 16 }}>
            {components.map(([name, value]) => (
              <Fragment key={name}>
                <dt>{name}</dt>
                <dd>
                  <StatusBadge value={value?.status || 'UNKNOWN'} />
                </dd>
              </Fragment>
            ))}
          </dl>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            Health details are hidden unless the caller is authorized. Overall status is still reported.
          </p>
        )}
      </section>

      <section className="panel panel-pad" style={{ marginBottom: 16 }}>
        <h2 className="panel-heading">OpenID Provider</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          OpenID discovery from this identity provider. This is not an OAuth client playground.
        </p>
        {discovery ? (
          <dl className="dl">
            <dt>Issuer</dt>
            <dd>
              <CopyableId value={discovery.issuer} label="Copy issuer" />
            </dd>
            <dt>JWKS</dt>
            <dd>
              <CopyableId value={discovery.jwks_uri} label="Copy JWKS URI" />
            </dd>
            <dt>Authorization</dt>
            <dd>
              <span className="mono">{discovery.authorization_endpoint || '—'}</span>
            </dd>
            <dt>Token</dt>
            <dd>
              <span className="mono">{discovery.token_endpoint || '—'}</span>
            </dd>
          </dl>
        ) : (
          <p className="muted">
            Discovery document is unavailable. Confirm the identity provider is running.
          </p>
        )}
      </section>

      <h2 className="panel-heading">Directory</h2>
      <div className="kpi-grid">
        <KpiCard
          label="Users"
          value={system?.totalUsers}
          hint={`${formatNumber(system?.activeUsers)} active · ${formatNumber(system?.lockedUsers)} locked`}
        />
        <KpiCard
          label="MFA enabled"
          value={system?.mfaEnabledUsers}
          hint={`${formatNumber(system?.mfaRequiredUsers)} required`}
        />
        <KpiCard
          label="Roles / permissions"
          value={system?.totalRoles}
          hint={`${formatNumber(system?.totalPermissions)} permissions`}
        />
        <KpiCard
          label="Applications"
          value={system?.totalClients}
          hint={`${formatNumber(system?.activeClients)} active`}
        />
      </div>
      <div className="kpi-grid">
        <KpiCard
          label="Sessions"
          value={system?.activeSessions}
          hint={`${formatNumber(system?.revokedSessions)} revoked`}
        />
        <KpiCard label="Currently locked" value={system?.currentlyLockedUsers} />
        <KpiCard label="Inactive users" value={system?.inactiveUsers} />
        <KpiCard label="Suspended users" value={system?.suspendedUsers} />
      </div>

      <h2 className="panel-heading">Security · last 24 hours</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        Window start {formatDateTime(security?.since)}
      </p>
      <div className="kpi-grid">
        <KpiCard label="Login success" value={security?.loginSuccess} />
        <KpiCard label="Login failure" value={security?.loginFailure} />
        <KpiCard label="MFA success" value={security?.mfaSuccess} />
        <KpiCard label="MFA failure" value={security?.mfaFailure} />
      </div>
      <div className="kpi-grid">
        <KpiCard label="Logouts" value={security?.logout} />
        <KpiCard label="Session revokes" value={security?.sessionRevoke} />
        <KpiCard label="Users with failed attempts" value={security?.usersWithFailedAttempts} />
        <KpiCard label="Currently locked" value={security?.currentlyLockedUsers} />
      </div>
    </>
  );
}
