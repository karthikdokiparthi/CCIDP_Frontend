import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { revokeAllSessions, revokeSession, searchSessions } from '../api/admin';
import { extractError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CopyableId } from '../components/CopyableId';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { RelativeTime } from '../components/RelativeTime';
import { shortId } from '../utils/format';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function SessionsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get('userId') || '';
  const [userIdInput, setUserIdInput] = useState(userId);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  function writeFilter(nextUserId, nextPage = 0) {
    const params = new URLSearchParams();
    if (nextUserId?.trim()) params.set('userId', nextUserId.trim());
    setSearchParams(params, { replace: true });
    setPage(nextPage);
  }

  async function load(nextUserId = userId, nextPage = page, nextSize = pageSize) {
    setLoading(true);
    setError('');
    try {
      setData(
        await searchSessions({
          userId: nextUserId.trim() || undefined,
          page: nextPage,
          size: nextSize,
        })
      );
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setUserIdInput(userId);
    setPage(0);
    load(userId, 0);
  }, [userId]);

  const filteredUserId = userId.trim();
  const canRevokeAll = UUID_PATTERN.test(filteredUserId);

  return (
    <>
      <PageHeader
        title="Sessions"
        description="Active and revoked authentication sessions across the directory."
      />
      {notice ? <div className="form-ok">{notice}</div> : null}
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(0);
          writeFilter(userIdInput, 0);
        }}
      >
        <input
          className="input search"
          placeholder="Filter by user ID (UUID)"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
        />
        <button className="btn" type="submit">
          Filter
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            writeFilter('', 0);
          }}
        >
          Clear
        </button>
        {canRevokeAll ? (
          <button
            className="btn btn-danger"
            type="button"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Revoke all sessions',
                message: `Revoke every session for user ${filteredUserId}?`,
                confirmLabel: 'Revoke all',
                action: async () => {
                  setBusy(true);
                  setNotice('');
                  try {
                    await revokeAllSessions(filteredUserId);
                    setNotice('All sessions revoked for this user');
                    toast.success('All sessions revoked for this user');
                    await load();
                  } catch (err) {
                    const message = extractError(err);
                    setError(message);
                    toast.error(message);
                  } finally {
                    setBusy(false);
                  }
                },
              })
            }
          >
            Revoke all for user
          </button>
        ) : null}
      </form>
      <div className="panel">
        <DataTable
          rows={data.content}
          loading={loading}
          error={error}
          onRetry={() => load()}
          emptyTitle="No sessions"
          emptyDescription="No sessions match the current filter."
          columns={[
            {
              key: 'id',
              header: 'Session',
              render: (row) => (
                <CopyableId value={row.id} display={shortId(row.id)} label="Copy session ID" />
              ),
            },
            {
              key: 'username',
              header: 'User',
              render: (row) => (
                <div className="cell-stack">
                  <div className="primary">{row.username || '—'}</div>
                  <div className="secondary mono">{shortId(row.userId)}</div>
                </div>
              ),
            },
            {
              key: 'state',
              header: 'State',
              render: (row) => (
                <StatusBadge value={row.revoked ? 'REVOKED' : row.active ? 'ACTIVE' : 'INACTIVE'} />
              ),
            },
            { key: 'ipAddress', header: 'IP', render: (row) => <span className="mono">{row.ipAddress || '—'}</span> },
            {
              key: 'deviceLabel',
              header: 'Device',
              render: (row) => row.deviceLabel || row.userAgent || '—',
            },
            {
              key: 'lastSeenAt',
              header: 'Last seen',
              render: (row) => <RelativeTime value={row.lastSeenAt} />,
            },
            {
              key: 'expiresAt',
              header: 'Expires',
              render: (row) => <RelativeTime value={row.expiresAt} />,
            },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                row.revoked ? (
                  <span className="faint">Revoked</span>
                ) : (
                  <button
                    className="btn btn-sm btn-danger"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        title: 'Revoke session',
                        message: `Revoke this session for ${row.username || 'the user'}?`,
                        confirmLabel: 'Revoke',
                        action: async () => {
                          setBusy(true);
                          setNotice('');
                          try {
                            await revokeSession(row.userId, row.id);
                            setNotice('Session revoked');
                            toast.success('Session revoked');
                            await load();
                          } catch (err) {
                            const message = extractError(err);
                            setError(message);
                            toast.error(message);
                          } finally {
                            setBusy(false);
                          }
                        },
                      })
                    }
                  >
                    Revoke
                  </button>
                ),
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
            load(userId, 0, size);
          }}
          onPageChange={(next) => {
            setPage(next);
            load(userId, next, pageSize);
          }}
        />
      </div>

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
            await action();
          }}
        />
      ) : null}
    </>
  );
}
