import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  assignUserRole,
  createUser,
  deleteUser,
  getAdminUser,
  listRoles,
  listUserRoles,
  listUserSessions,
  removeUserRole,
  revokeAllSessions,
  revokeSession,
  searchAudit,
  searchUsers,
  setUserMfaRequired,
  setUserPassword,
  setUserAdminPassword,
  updateUser,
  updateUserStatus,
} from '../api/admin';
import { extractError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CopyableId } from '../components/CopyableId';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { RelativeTime } from '../components/RelativeTime';
import { MfaBadge, StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { ACCOUNT_TYPES, USER_STATUSES } from '../utils/constants';
import { debounce, displayName, shortId } from '../utils/format';
import { setQueryParam } from '../utils/query';
import { BRIGHTGRID_EMAIL_MESSAGE, BRIGHTGRID_EMAIL_PATTERN, isBrightGridEmail } from '../utils/email';

const EMPTY_CREATE = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  mobileNumber: '',
  accountType: 'EMPLOYEE',
  password: '',
};

export function UsersPage() {
  const toast = useToast();
  const { setCrumbExtra } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [mfaFilter, setMfaFilter] = useState('');
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [roles, setRoles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState({ email: '', firstName: '', lastName: '', mobileNumber: '' });
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineError, setTimelineError] = useState('');
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [userSessions, setUserSessions] = useState([]);

  const load = async (nextQuery = query, nextStatus = status, nextPage = page, nextSize = pageSize) => {
    setLoading(true);
    setError('');
    try {
      const result = await searchUsers({
        q: nextQuery || undefined,
        status: nextStatus || undefined,
        page: nextPage,
        size: nextSize,
      });
      setData(result);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setPage(0);
        load(value, status, 0, pageSize);
      }, 350),
    [status, pageSize]
  );

  useEffect(() => {
    load();
    listRoles()
      .then((list) => setRoles(Array.isArray(list) ? list : list?.content || []))
      .catch((err) => {
        setRoles([]);
        setError((current) => current || extractError(err));
      });
  }, []);

  useEffect(() => {
    const id = searchParams.get('userId');
    setSelectedId(id || null);
  }, [searchParams]);

  function openUser(id) {
    if (!id) {
      setSelectedId(null);
      setDetail(null);
    }
    setQueryParam(setSearchParams, 'userId', id || null);
  }

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setAssignedRoles([]);
      setUserSessions([]);
      return;
    }
    let cancelled = false;
    getAdminUser(selectedId)
      .then((user) => {
        if (cancelled) return;
        setDetail(user);
        setEdit({
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          mobileNumber: user.mobileNumber || '',
        });
        setNotice('');
        setFormError('');
        setPassword('');
        setAdminPassword('');
      })
      .catch((err) => {
        if (!cancelled) setFormError(extractError(err));
      });
    listUserRoles(selectedId)
      .then((list) => {
        if (!cancelled) setAssignedRoles(list || []);
      })
      .catch(() => {
        if (!cancelled) setAssignedRoles([]);
      });
    listUserSessions(selectedId)
      .then((list) => {
        if (!cancelled) setUserSessions(list || []);
      })
      .catch(() => {
        if (!cancelled) setUserSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    setCrumbExtra?.(detail ? displayName(detail) : null);
    return () => setCrumbExtra?.(null);
  }, [detail, setCrumbExtra]);

  useEffect(() => {
    if (!selectedId) {
      setTimeline([]);
      setTimelineError('');
      setTimelineLoading(false);
      return;
    }
    let cancelled = false;
    setTimelineLoading(true);
    searchAudit({ userId: selectedId, page: 0, size: 10 })
      .then((result) => {
        if (cancelled) return;
        setTimeline(result.content || []);
        setTimelineError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setTimeline([]);
        setTimelineError(extractError(err));
      })
      .finally(() => {
        if (!cancelled) setTimelineLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function run(action, successMessage, { refreshDetail = true } = {}) {
    setBusy(true);
    setFormError('');
    setNotice('');
    try {
      await action();
      if (successMessage) {
        setNotice(successMessage);
        toast.success(successMessage);
      }
      if (refreshDetail && selectedId) {
        setDetail(await getAdminUser(selectedId));
        try {
          setAssignedRoles((await listUserRoles(selectedId)) || []);
        } catch {
          setAssignedRoles([]);
        }
        try {
          setUserSessions((await listUserSessions(selectedId)) || []);
        } catch {
          setUserSessions([]);
        }
      }
      await load();
    } catch (err) {
      setFormError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  const visibleRows = useMemo(() => {
    const content = data.content || [];
    if (mfaFilter === 'on') return content.filter((row) => row.mfaEnabled);
    if (mfaFilter === 'off') return content.filter((row) => !row.mfaEnabled);
    return content;
  }, [data.content, mfaFilter]);

  return (
    <>
      <PageHeader
        title="Users"
        description="Search the directory, inspect MFA and lockout state, and manage account status."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setCreating(true)}>
            Create user
          </button>
        }
      />
      <div className="toolbar">
        <input
          className="input search"
          placeholder="Search username, email, or name"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />
        <select
          className="select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
            load(query, e.target.value, 0, pageSize);
          }}
        >
          <option value="">All statuses</option>
          {USER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div className="filter-chips" role="group" aria-label="MFA">
          {[
            { value: '', label: 'All MFA' },
            { value: 'on', label: 'MFA on' },
            { value: 'off', label: 'MFA off' },
          ].map((item) => (
            <button
              key={item.value || 'all'}
              className={`chip-filter${mfaFilter === item.value ? ' is-active' : ''}`}
              type="button"
              onClick={() => setMfaFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="panel">
        <DataTable
          rows={visibleRows}
          loading={loading}
          error={error}
          onRetry={() => load()}
          onRowClick={(row) => openUser(row.id)}
          emptyTitle="No users found"
          emptyDescription={
            mfaFilter
              ? 'No users on this page match the MFA filter. Try another page or clear the filter.'
              : 'Adjust the search or status filter, or create a directory user.'
          }
          columns={[
            {
              key: 'username',
              header: 'User',
              render: (row) => (
                <div className="cell-stack">
                  <div className="primary">{displayName(row)}</div>
                  <div className="secondary">{row.username}</div>
                </div>
              ),
            },
            { key: 'email', header: 'Email' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusBadge value={row.status} />,
            },
            {
              key: 'mfa',
              header: 'MFA',
              render: (row) => <MfaBadge enabled={row.mfaEnabled} required={row.mfaRequired} />,
            },
            {
              key: 'roles',
              header: 'Roles',
              render: (row) =>
                Array.isArray(row.roles) && row.roles.length ? (
                  <div className="badge-row">
                    {row.roles.map((role) => (
                      <span className="badge" key={role}>
                        {role}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="faint">None</span>
                ),
            },
            { key: 'accountType', header: 'Type', render: (row) => <StatusBadge value={row.accountType} /> },
            {
              key: 'lastLoginAt',
              header: 'Last login',
              render: (row) => <RelativeTime value={row.lastLoginAt} />,
            },
          ]}
        />
        <Pagination
          page={data.number ?? page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
            load(query, status, 0, size);
          }}
          onPageChange={(next) => {
            setPage(next);
            load(query, status, next, pageSize);
          }}
        />
      </div>

      {detail ? (
        <Drawer
          title={displayName(detail)}
          subtitle={detail.username}
          onClose={() => openUser(null)}
        >
          {formError ? <div className="form-error">{formError}</div> : null}
          {notice ? <div className="form-ok">{notice}</div> : null}
          <dl className="dl">
            <dt>User ID</dt>
            <dd>
              <CopyableId value={detail.id} label="Copy user ID" />
            </dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge value={detail.status} />
            </dd>
            <dt>Email</dt>
            <dd>{detail.email || '—'}</dd>
            <dt>Mobile</dt>
            <dd>{detail.mobileNumber || '—'}</dd>
            <dt>Account type</dt>
            <dd>
              <StatusBadge value={detail.accountType} />
            </dd>
            <dt>MFA</dt>
            <dd>
              <MfaBadge enabled={detail.mfaEnabled} required={detail.mfaRequired} />
            </dd>
            <dt>Failed logins</dt>
            <dd>{detail.failedLoginAttempts ?? 0}</dd>
            <dt>Locked until</dt>
            <dd>
              <RelativeTime value={detail.lockedUntil} />
            </dd>
            <dt>Last login</dt>
            <dd>
              <RelativeTime value={detail.lastLoginAt} />
            </dd>
            <dt>Roles</dt>
            <dd>
              <div className="badge-row">
                {(assignedRoles.length ? assignedRoles.map((role) => role.roleName) : detail.roles || []).length
                  ? (assignedRoles.length
                      ? assignedRoles.map((role) => role.roleName)
                      : detail.roles
                    ).map((role) => (
                      <span className="badge" key={role}>
                        {role}
                      </span>
                    ))
                  : '—'}
              </div>
            </dd>
          </dl>

          <div className="section-head">
            <div className="section-title">Security timeline</div>
            <Link to={`/audit?userId=${encodeURIComponent(detail.id)}`}>View all</Link>
          </div>
          {timelineLoading ? <p className="muted">Loading recent events…</p> : null}
          {timelineError ? <p className="muted">{timelineError}</p> : null}
          {!timelineLoading && !timelineError && !timeline.length ? (
            <p className="muted">No recent audit events for this user.</p>
          ) : null}
          {timeline.length ? (
            <ol className="timeline">
              {timeline.map((event, index) => (
                <li className="timeline-item" key={event.id || `${event.createdAt}-${index}`}>
                  <div>
                    <div className="timeline-meta">
                      <span className="timeline-type">{event.eventType}</span>
                      <StatusBadge value={event.outcome} />
                    </div>
                    <div className="timeline-ip mono faint">{event.ipAddress || '—'}</div>
                  </div>
                  <RelativeTime value={event.createdAt} />
                </li>
              ))}
            </ol>
          ) : null}

          <div className="section-title">Profile</div>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={edit.email}
              onChange={(e) => setEdit({ ...edit, email: e.target.value })}
              pattern={BRIGHTGRID_EMAIL_PATTERN}
              title={BRIGHTGRID_EMAIL_MESSAGE}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>First name</label>
              <input
                className="input"
                value={edit.firstName}
                onChange={(e) => setEdit({ ...edit, firstName: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Last name</label>
              <input
                className="input"
                value={edit.lastName}
                onChange={(e) => setEdit({ ...edit, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Mobile number</label>
            <input
              className="input"
              value={edit.mobileNumber}
              onChange={(e) => setEdit({ ...edit, mobileNumber: e.target.value })}
            />
          </div>
          <button
            className="btn btn-sm"
            type="button"
            disabled={busy}
            onClick={() => {
              if (edit.email && !isBrightGridEmail(edit.email)) {
                setFormError(BRIGHTGRID_EMAIL_MESSAGE);
                return;
              }
              run(() => updateUser(detail.id, edit), 'Profile updated');
            }}
          >
            Save profile
          </button>

          <div className="section-title">Status</div>
          <div className="toolbar">
            {USER_STATUSES.map((item) => (
              <button
                key={item}
                className="btn btn-sm"
                type="button"
                disabled={busy || detail.status === item}
                onClick={() => {
                  const destructive = item === 'LOCKED' || item === 'SUSPENDED';
                  const apply = () => run(() => updateUserStatus(detail.id, item), `Status set to ${item}`);
                  if (!destructive) {
                    apply();
                    return;
                  }
                  setConfirm({
                    title: `Set status to ${item}`,
                    message: `Change ${detail.username} to ${item}? This immediately affects sign-in.`,
                    confirmLabel: `Set ${item}`,
                    danger: true,
                    action: apply,
                  });
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="section-title">MFA requirement</div>
          <button
            className="btn btn-sm"
            type="button"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: detail.mfaRequired ? 'Clear MFA required' : 'Require MFA',
                message: detail.mfaRequired
                  ? `Stop requiring MFA for ${detail.username}? Existing enrollment is unchanged.`
                  : `Require MFA for ${detail.username}? They must complete enrollment on next sign-in if not already enrolled.`,
                confirmLabel: detail.mfaRequired ? 'Clear requirement' : 'Require MFA',
                action: () =>
                  run(
                    () => setUserMfaRequired(detail.id, !detail.mfaRequired),
                    detail.mfaRequired ? 'MFA no longer required' : 'MFA now required'
                  ),
              })
            }
          >
            {detail.mfaRequired ? 'Clear MFA required' : 'Require MFA'}
          </button>

          <div className="section-title">Create password</div>
          <p className="muted">
            Sets the first password via the credentials API. If a password already exists, this call is
            rejected.
          </p>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <button
            className="btn btn-sm"
            type="button"
            disabled={busy || password.length < 8}
            onClick={() =>
              run(async () => {
                await setUserPassword(detail.id, password);
                setPassword('');
              }, 'Password created')
            }
          >
            Create password
          </button>

          <div className="section-title">Set password</div>
          <p className="muted">
            Admin overwrite. Does not require the user&apos;s current password. Existing sessions stay
            until refresh tokens are rotated; refresh tokens are revoked.
          </p>
          <div className="field">
            <label>New password</label>
            <input
              className="input"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button
            className="btn btn-sm"
            type="button"
            disabled={busy || adminPassword.length < 8}
            onClick={() =>
              setConfirm({
                title: 'Set password',
                message: `Overwrite the password for ${detail.username}? They must use the new password to sign in.`,
                confirmLabel: 'Set password',
                danger: true,
                action: () =>
                  run(async () => {
                    await setUserAdminPassword(detail.id, adminPassword);
                    setAdminPassword('');
                  }, 'Password set'),
              })
            }
          >
            Set password
          </button>

          <div className="section-title">Assign role</div>
          <p className="muted">
            Superadmin sets one role per employee. Assigning a role replaces every previous role; only the new role remains.
          </p>
          <div className="toolbar">
            <select className="select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-sm"
              type="button"
              disabled={busy || !roleId}
              onClick={() =>
                run(
                  () => assignUserRole(detail.id, roleId),
                  'Role replaced. That person must sign in again. They now have only this role.'
                )
              }
            >
              Set role
            </button>
          </div>
          {(assignedRoles.length ? assignedRoles : []).map((role) => (
            <button
              key={role.roleId}
              className="btn btn-sm"
              style={{ marginRight: 8, marginBottom: 8 }}
              type="button"
              disabled={busy}
              onClick={() =>
                setConfirm({
                  title: 'Remove role',
                  message: `Remove ${role.roleName} from ${detail.username}?`,
                  confirmLabel: 'Remove',
                  danger: true,
                  action: () => run(() => removeUserRole(detail.id, role.roleId), 'Role removed'),
                })
              }
            >
              Remove {role.roleName}
            </button>
          ))}

          <div className="section-title">Sessions</div>
          <div className="section-head">
            <p className="muted" style={{ margin: 0 }}>
              Sessions issued to this account.
            </p>
            <Link className="btn btn-sm" to={`/sessions?userId=${encodeURIComponent(detail.id)}`}>
              View all
            </Link>
          </div>
          {userSessions.length ? (
            <ul className="assignment-list">
              {userSessions.map((session) => (
                <li key={session.id}>
                  <div>
                    <div className="primary mono">{shortId(session.id)}</div>
                    <div className="secondary faint">
                      {session.ipAddress || '—'} · <RelativeTime value={session.lastSeenAt} />
                    </div>
                  </div>
                  {session.revoked ? (
                    <span className="faint">Revoked</span>
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
                          danger: true,
                          action: () => run(() => revokeSession(detail.id, session.id), 'Session revoked'),
                        })
                      }
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No sessions for this user.</p>
          )}
          <button
            className="btn btn-sm btn-danger"
            type="button"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Revoke all sessions',
                message: `Revoke every session for ${detail.username}? They will have to sign in again.`,
                confirmLabel: 'Revoke all',
                danger: true,
                action: () => run(() => revokeAllSessions(detail.id), 'All sessions revoked'),
              })
            }
          >
            Revoke all sessions
          </button>

          <div className="section-title">Danger zone</div>
          <button
            className="btn btn-sm btn-danger"
            type="button"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Delete user',
                message: `Delete ${detail.username}? This cannot be undone from the console.`,
                confirmLabel: 'Delete user',
                danger: true,
                action: async () => {
                  await run(
                    async () => {
                      await deleteUser(detail.id);
                      openUser(null);
                    },
                    'User deleted',
                    { refreshDetail: false }
                  );
                },
              })
            }
          >
            Delete user
          </button>
        </Drawer>
      ) : null}

      {creating ? (
        <Modal
          title="Create user"
          subtitle="Creates a directory account, then sets the first password through the credentials API."
          onClose={() => setCreating(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={busy || createForm.password.length < 8}
                onClick={() => {
                  if (!isBrightGridEmail(createForm.email)) {
                    setFormError(BRIGHTGRID_EMAIL_MESSAGE);
                    return;
                  }
                  run(async () => {
                    const payload = {
                      username: createForm.username,
                      email: createForm.email,
                      firstName: createForm.firstName,
                      lastName: createForm.lastName,
                      mobileNumber: createForm.mobileNumber || undefined,
                      accountType: createForm.accountType,
                    };
                    const created = await createUser(payload);
                    await setUserPassword(created.id, createForm.password);
                    setCreating(false);
                    setCreateForm(EMPTY_CREATE);
                    if (created?.id) openUser(created.id);
                  }, 'User created');
                }}
              >
                Create
              </button>
            </>
          }
        >
          {formError ? <div className="form-error">{formError}</div> : null}
          <div className="field">
            <label>Username</label>
            <input
              className="input"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              pattern={BRIGHTGRID_EMAIL_PATTERN}
              title={BRIGHTGRID_EMAIL_MESSAGE}
              required
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>First name</label>
              <input
                className="input"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Last name</label>
              <input
                className="input"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Mobile number</label>
            <input
              className="input"
              value={createForm.mobileNumber}
              onChange={(e) => setCreateForm({ ...createForm, mobileNumber: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Account type</label>
            <select
              className="select"
              value={createForm.accountType}
              onChange={(e) => setCreateForm({ ...createForm, accountType: e.target.value })}
            >
              {ACCOUNT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Initial password</label>
            <input
              className="input"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              minLength={8}
              required
            />
            <span className="faint">Required. Minimum 8 characters, with upper, lower, a digit, and a symbol. User create has no password field, so the console sets it immediately afterward with the credentials API.</span>
          </div>
        </Modal>
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const action = confirm.action;
            setConfirm(null);
            await action();
          }}
        />
      ) : null}
    </>
  );
}
