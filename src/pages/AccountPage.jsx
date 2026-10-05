import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  confirmMfa,
  disableMfa,
  enrollMfa,
  getMfaStatus,
  getMyAudit,
  getOwnSessions,
  logoutAll,
  revokeOwnSession,
} from '../api/auth';
import { changeUserPassword } from '../api/admin';
import { beginVoluntaryLogout, extractError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { hasDirectoryAdminRole } from '../utils/destinations';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CopyableId, copyText } from '../components/CopyableId';
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { MfaBadge, StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { RelativeTime } from '../components/RelativeTime';
import { displayName, shortId } from '../utils/format';
import { downloadText } from '../utils/csv';

export function AccountPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [confirm, setConfirm] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [mfa, ownSessions] = await Promise.all([getMfaStatus(), getOwnSessions()]);
      setStatus(mfa);
      setSessions(ownSessions || []);
      try {
        const mine = await getMyAudit({ page: 0, size: 10 });
        setEvents(mine?.content || []);
      } catch {
        setEvents([]);
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

  function wipeEnrollment() {
    setEnrollment(null);
    setQrDataUrl('');
    setCode('');
  }

  async function startEnroll() {
    setBusy(true);
    setError('');
    setNotice('');
    wipeEnrollment();
    try {
      const payload = await enrollMfa();
      setEnrollment({
        otpauthUri: payload.otpauthUri,
        recoveryCodes: payload.recoveryCodes || [],
      });
      if (payload.otpauthUri) {
        const url = await QRCode.toDataURL(payload.otpauthUri, {
          margin: 1,
          width: 176,
          color: { dark: '#0b1220', light: '#ffffff' },
        });
        setQrDataUrl(url);
      }
    } catch (err) {
      const message = extractError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function finishEnroll(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const next = await confirmMfa(code.trim());
      setStatus(next);
      wipeEnrollment();
      setNotice('Authenticator enrolled. Recovery codes will not be shown again.');
      toast.success('Authenticator enrolled');
    } catch (err) {
      const message = extractError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function finishDisable(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const next = await disableMfa(code.trim());
      setStatus(next);
      setCode('');
      setNotice('Authenticator disabled for this account.');
      toast.success('Authenticator disabled');
    } catch (err) {
      const message = extractError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(sessionId) {
    setBusy(true);
    setError('');
    try {
      await revokeOwnSession(sessionId);
      setNotice('Session revoked');
      toast.success('Session revoked');
      setSessions(await getOwnSessions());
    } catch (err) {
      const message = extractError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading account" />;
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your password, authenticator, and sessions for this account."
      />
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {notice ? <div className="form-ok">{notice}</div> : null}

      <div className="account-grid">
        <section className="panel panel-pad">
          <h2 className="panel-heading">Profile</h2>
          <dl className="dl">
            <dt>Name</dt>
            <dd>{displayName(user)}</dd>
            <dt>Username</dt>
            <dd>{user?.username}</dd>
            <dt>Email</dt>
            <dd>{user?.email || '—'}</dd>
            <dt>Roles</dt>
            <dd>{Array.isArray(user?.roles) && user.roles.length ? user.roles.join(', ') : '—'}</dd>
          </dl>
          <div className="section-title">Change password</div>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError('');
              setNotice('');
              try {
                await changeUserPassword(
                  user.userId,
                  passwordForm.currentPassword,
                  passwordForm.newPassword
                );
                setPasswordForm({ currentPassword: '', newPassword: '' });
                setNotice('Password changed');
                toast.success('Password changed');
              } catch (err) {
                const message = extractError(err);
                setError(message);
                toast.error(message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="field">
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                className="input"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                className="input"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                minLength={8}
                required
              />
              <span className="faint">Minimum 8 characters, with upper, lower, a digit, and a symbol.</span>
              <span className="faint">Minimum 8 characters, with upper, lower, a digit, and a symbol.</span>
            </div>
            <button className="btn btn-sm" type="submit" disabled={busy}>
              Update password
            </button>
          </form>
        </section>

        <section className="panel panel-pad">
          <h2 className="panel-heading">Authenticator</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            <MfaBadge enabled={status?.mfaEnabled} required={status?.mfaRequired} />
          </p>
          {status?.mfaRequired && !status?.mfaEnabled ? (
            <p className="muted">This account is required to complete MFA enrollment.</p>
          ) : null}

          {enrollment ? (
            <form onSubmit={finishEnroll}>
              <div className="section-head">
                <p className="muted" style={{ margin: 0 }}>
                  Scan the code with your authenticator app, store the recovery codes, then confirm with a
                  one-time code. These values are shown only for this enrollment.
                </p>
                <button className="btn btn-ghost btn-sm" type="button" onClick={wipeEnrollment} aria-label="Close enrollment">
                  Close
                </button>
              </div>
              {qrDataUrl ? (
                <img className="qr-frame" src={qrDataUrl} alt="Authenticator enrollment QR code" />
              ) : (
                <p className="muted">Add the account in your authenticator using the enrollment QR from the API response.</p>
              )}
              <div className="section-title">Recovery codes</div>
              <ul className="recovery-list">
                {enrollment.recoveryCodes.map((item) => (
                  <li key={item} className="mono">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="toolbar" style={{ marginTop: 8 }}>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={async () => {
                    try {
                      await copyText(enrollment.recoveryCodes.join('\n'));
                      toast.success('Copied');
                    } catch {
                      toast.error('Could not copy');
                    }
                  }}
                >
                  Copy recovery codes
                </button>
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() =>
                    downloadText(
                      'ccidp-recovery-codes.txt',
                      enrollment.recoveryCodes.join('\n'),
                      'text/plain;charset=utf-8'
                    )
                  }
                >
                  Download recovery codes
                </button>
              </div>
              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="enroll-code">Verification code</label>
                <input
                  id="enroll-code"
                  className="input mfa-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>
              <div className="toolbar">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Confirm enrollment
                </button>
                <button className="btn" type="button" disabled={busy} onClick={wipeEnrollment}>
                  Cancel
                </button>
              </div>
            </form>
          ) : status?.mfaEnabled ? (
            <form onSubmit={finishDisable}>
              <p className="muted">Disable requires a current authenticator code.</p>
              <div className="field">
                <label htmlFor="disable-code">Verification code</label>
                <input
                  id="disable-code"
                  className="input mfa-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>
              <button className="btn btn-danger" type="submit" disabled={busy}>
                Disable authenticator
              </button>
            </form>
          ) : (
            <button className="btn btn-primary" type="button" disabled={busy} onClick={startEnroll}>
              Enroll authenticator
            </button>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-pad panel-split">
          <div>
            <h2 className="panel-heading">This device and others</h2>
            <p className="muted">Sessions issued to your account.</p>
          </div>
          <button
            className="btn btn-sm btn-danger"
            type="button"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Sign out all devices',
                message: 'This revokes every session for your account, including this console session.',
                confirmLabel: 'Sign out all',
                action: async () => {
                  beginVoluntaryLogout();
                  await logoutAll();
                  await logout();
                },
              })
            }
          >
            Sign out all devices
          </button>
        </div>
        <DataTable
          rows={sessions}
          emptyTitle="No sessions"
          emptyDescription="No sessions are registered for this account."
          columns={[
            {
              key: 'id',
              header: 'Session',
              render: (row) => (
                <CopyableId value={row.id} display={shortId(row.id)} label="Copy session ID" />
              ),
            },
            {
              key: 'deviceLabel',
              header: 'Device',
              render: (row) => row.deviceLabel || row.userAgent || '—',
            },
            {
              key: 'state',
              header: 'State',
              render: (row) => (
                <StatusBadge value={row.revoked ? 'REVOKED' : row.current ? 'ACTIVE' : 'ACTIVE'} />
              ),
            },
            { key: 'ipAddress', header: 'IP', render: (row) => <span className="mono">{row.ipAddress || '—'}</span> },
            {
              key: 'lastSeenAt',
              header: 'Last seen',
              render: (row) => <RelativeTime value={row.lastSeenAt} />,
            },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                row.revoked || row.current ? (
                  <span className="faint">{row.current ? 'Current' : 'Revoked'}</span>
                ) : (
                  <button
                    className="btn btn-sm btn-danger"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        title: 'Revoke session',
                        message: 'Revoke this session? The device will have to sign in again.',
                        confirmLabel: 'Revoke',
                        action: () => onRevoke(row.id),
                      })
                    }
                  >
                    Revoke
                  </button>
                ),
            },
          ]}
        />
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-pad panel-split">
          <div>
            <h2 className="panel-heading">My audit activity</h2>
            <p className="muted">Latest events for this account.</p>
          </div>
          {hasDirectoryAdminRole(user) && user?.userId ? (
            <Link className="btn btn-sm" to={`/audit?userId=${encodeURIComponent(user.userId)}`}>
              View all
            </Link>
          ) : null}
        </div>
        <DataTable
          rows={events}
          emptyTitle="No audit events"
          emptyDescription="Your recent identity events will appear here."
          columns={[
            {
              key: 'createdAt',
              header: 'Time',
              render: (row) => <RelativeTime value={row.createdAt} />,
            },
            { key: 'eventType', header: 'Event' },
            {
              key: 'outcome',
              header: 'Outcome',
              render: (row) => <StatusBadge value={row.outcome} />,
            },
            { key: 'ipAddress', header: 'IP', render: (row) => <span className="mono">{row.ipAddress || '—'}</span> },
            { key: 'detail', header: 'Detail', render: (row) => row.detail || '—' },
          ]}
        />
      </section>

      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const action = confirm.action;
            setConfirm(null);
            setBusy(true);
            try {
              await action();
            } catch (err) {
              setError(extractError(err));
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
    </>
  );
}
