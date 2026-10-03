import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  createClient,
  deleteClient,
  disableClient,
  enableClient,
  getClient,
  rotateClientSecret,
  searchClients,
  updateClient,
} from '../api/admin';
import { extractError } from '../api/client';
import { ChipInput } from '../components/ChipInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CopyableId } from '../components/CopyableId';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { CLIENT_STATUSES, CLIENT_TYPES, GRANT_TYPES } from '../utils/constants';
import { debounce, formatDateTime, linesToSet, setToLines, toUriList } from '../utils/format';
import { setQueryParam } from '../utils/query';

const EMPTY_CREATE = {
  clientId: '',
  clientName: '',
  clientType: 'CONFIDENTIAL',
  redirectUris: [],
  postLogoutRedirectUris: '',
  scopes: 'openid\nprofile',
  authorizationGrantTypes: 'authorization_code\nrefresh_token',
  requirePkce: true,
  requireConsent: true,
};

export function ClientsPage() {
  const toast = useToast();
  const { setCrumbExtra } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [secret, setSecret] = useState('');
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [edit, setEdit] = useState(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async (nextQuery = query, nextStatus = status, nextPage = page, nextSize = pageSize) => {
    setLoading(true);
    setError('');
    try {
      setData(
        await searchClients({
          q: nextQuery || undefined,
          status: nextStatus || undefined,
          page: nextPage,
          size: nextSize,
        })
      );
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
  }, []);

  useEffect(() => {
    const id = searchParams.get('clientId');
    setSelectedId(id || null);
  }, [searchParams]);

  function openClient(id) {
    if (!id) {
      setSelectedId(null);
      setDetail(null);
    }
    setQueryParam(setSearchParams, 'clientId', id || null);
  }

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    getClient(selectedId)
      .then((client) => {
        if (cancelled) return;
        setDetail(client);
        setEdit({
          clientName: client.clientName || '',
          redirectUris: toUriList(client.redirectUris),
          postLogoutRedirectUris: setToLines(client.postLogoutRedirectUris),
          scopes: setToLines(client.scopes),
          authorizationGrantTypes: setToLines(client.authorizationGrantTypes),
          requirePkce: !!client.requirePkce,
          requireConsent: !!client.requireConsent,
          status: client.status,
        });
        setFormError('');
        setNotice('');
      })
      .catch((err) => {
        if (!cancelled) setFormError(extractError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    setCrumbExtra?.(detail?.clientName || null);
    return () => setCrumbExtra?.(null);
  }, [detail, setCrumbExtra]);

  async function run(action, successMessage, { refresh = true } = {}) {
    setBusy(true);
    setFormError('');
    setNotice('');
    try {
      const result = await action();
      if (result?.clientSecret) {
        setSecret(result.clientSecret);
      }
      if (successMessage) {
        setNotice(successMessage);
        toast.success(successMessage);
      }
      if (refresh && selectedId) {
        const client = await getClient(selectedId);
        setDetail(client);
      }
      await load();
      return result === undefined ? true : result;
    } catch (err) {
      setFormError(extractError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Applications"
        description="Registered OAuth clients. Secrets are shown only immediately after create or rotate."
        actions={
          <button className="btn btn-primary" type="button" onClick={() => setCreating(true)}>
            Register application
          </button>
        }
      />
      {secret ? (
        <div className="secret-banner">
          Client secret — copy it now. It will not be shown again.
          <code>{secret}</code>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-sm" type="button" onClick={() => navigator.clipboard.writeText(secret)}>
              Copy secret
            </button>
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => setSecret('')}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <div className="toolbar">
        <input
          className="input search"
          placeholder="Search client ID or name"
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
          {CLIENT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="panel">
        <DataTable
          rows={data.content}
          loading={loading}
          error={error}
          onRetry={() => load()}
          onRowClick={(row) => openClient(row.id)}
          emptyTitle="No applications"
          emptyDescription="Register an OAuth client to allow applications to authenticate against CCIDP."
          columns={[
            {
              key: 'clientName',
              header: 'Application',
              render: (row) => (
                <div className="cell-stack">
                  <div className="primary">{row.clientName}</div>
                  <div className="secondary mono">{row.clientId}</div>
                </div>
              ),
            },
            { key: 'clientType', header: 'Type', render: (row) => <StatusBadge value={row.clientType} /> },
            { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'requirePkce', header: 'PKCE', render: (row) => (row.requirePkce ? 'Required' : 'Optional') },
            { key: 'requireConsent', header: 'Consent', render: (row) => (row.requireConsent ? 'Required' : 'Skipped') },
            {
              key: 'updatedAt',
              header: 'Updated',
              render: (row) => <span className="mono">{formatDateTime(row.updatedAt)}</span>,
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

      {detail && edit ? (
        <Drawer
          title={detail.clientName}
          subtitle={detail.clientId}
          onClose={() => openClient(null)}
        >
          {formError ? <div className="form-error">{formError}</div> : null}
          {notice ? <div className="form-ok">{notice}</div> : null}
          <dl className="dl">
            <dt>Client ID</dt>
            <dd>
              <CopyableId value={detail.clientId} label="Copy client ID" />
            </dd>
            <dt>Type</dt>
            <dd>
              <StatusBadge value={detail.clientType} />
            </dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge value={detail.status} />
            </dd>
            <dt>Created</dt>
            <dd>{formatDateTime(detail.createdAt)}</dd>
          </dl>
          <div className="section-title">Configuration</div>
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={edit.clientName}
              onChange={(e) => setEdit({ ...edit, clientName: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Redirect URIs</label>
            <ChipInput
              values={edit.redirectUris}
              onChange={(redirectUris) => setEdit({ ...edit, redirectUris })}
              placeholder="https://app.example/callback"
            />
          </div>
          <div className="field">
            <label>Post-logout redirect URIs</label>
            <textarea
              className="textarea"
              value={edit.postLogoutRedirectUris}
              onChange={(e) => setEdit({ ...edit, postLogoutRedirectUris: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Scopes</label>
            <textarea
              className="textarea"
              value={edit.scopes}
              onChange={(e) => setEdit({ ...edit, scopes: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Grant types</label>
            <textarea
              className="textarea"
              value={edit.authorizationGrantTypes}
              onChange={(e) => setEdit({ ...edit, authorizationGrantTypes: e.target.value })}
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={edit.requirePkce}
              onChange={(e) => setEdit({ ...edit, requirePkce: e.target.checked })}
            />
            Require PKCE
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={edit.requireConsent}
              onChange={(e) => setEdit({ ...edit, requireConsent: e.target.checked })}
            />
            Require consent
          </label>
          <div className="toolbar">
            <button
              className="btn btn-sm"
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  () =>
                    updateClient(detail.id, {
                      clientName: edit.clientName,
                      redirectUris: edit.redirectUris || [],
                      postLogoutRedirectUris: linesToSet(edit.postLogoutRedirectUris) || [],
                      scopes: linesToSet(edit.scopes) || [],
                      authorizationGrantTypes: linesToSet(edit.authorizationGrantTypes) || [],
                      requirePkce: edit.requirePkce,
                      requireConsent: edit.requireConsent,
                      status: edit.status,
                    }),
                  'Application updated'
                )
              }
            >
              Save
            </button>
            {detail.status === 'ACTIVE' ? (
              <button
                className="btn btn-sm"
                type="button"
                disabled={busy}
                onClick={() =>
                  setConfirm({
                    title: 'Disable application',
                    message: `Disable ${detail.clientName}? Authorization requests for this client will be rejected.`,
                    confirmLabel: 'Disable',
                    danger: true,
                    action: () => run(() => disableClient(detail.id), 'Application disabled'),
                  })
                }
              >
                Disable
              </button>
            ) : (
              <button
                className="btn btn-sm"
                type="button"
                disabled={busy}
                onClick={() => run(() => enableClient(detail.id), 'Application enabled')}
              >
                Enable
              </button>
            )}
            {detail.clientType === 'CONFIDENTIAL' ? (
              <button
                className="btn btn-sm btn-danger"
                type="button"
                disabled={busy}
                onClick={() =>
                  setConfirm({
                    title: 'Rotate client secret',
                    message: `Rotate the secret for ${detail.clientId}? The previous secret stops working immediately. The new secret is shown only once.`,
                    confirmLabel: 'Rotate secret',
                    danger: true,
                    action: () => run(() => rotateClientSecret(detail.id), 'Secret rotated'),
                  })
                }
              >
                Rotate secret
              </button>
            ) : null}
            <button
              className="btn btn-sm btn-danger"
              type="button"
              disabled={busy}
              onClick={() =>
                setConfirm({
                  title: 'Delete application',
                  message: `Delete ${detail.clientName}? This cannot be undone from the console.`,
                  confirmLabel: 'Delete',
                  danger: true,
                  action: async () => {
                    const ok = await run(() => deleteClient(detail.id), 'Application deleted', {
                      refresh: false,
                    });
                    if (ok !== false) openClient(null);
                  },
                })
              }
            >
              Delete
            </button>
          </div>
        </Drawer>
      ) : null}

      {creating ? (
        <Modal
          title="Register application"
          subtitle="Confidential clients receive a generated secret. Public clients do not."
          onClose={() => setCreating(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const created = await createClient({
                      clientId: createForm.clientId || undefined,
                      clientName: createForm.clientName,
                      clientType: createForm.clientType,
                      redirectUris: createForm.redirectUris.length ? createForm.redirectUris : undefined,
                      postLogoutRedirectUris: linesToSet(createForm.postLogoutRedirectUris),
                      scopes: linesToSet(createForm.scopes),
                      authorizationGrantTypes: linesToSet(createForm.authorizationGrantTypes),
                      requirePkce: createForm.requirePkce,
                      requireConsent: createForm.requireConsent,
                    });
                    setCreating(false);
                    setCreateForm(EMPTY_CREATE);
                    if (created?.id) openClient(created.id);
                    return created;
                  }, 'Application registered')
                }
              >
                Register
              </button>
            </>
          }
        >
          {formError ? <div className="form-error">{formError}</div> : null}
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={createForm.clientName}
              onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Client ID (optional)</label>
            <input
              className="input"
              value={createForm.clientId}
              onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Type</label>
            <select
              className="select"
              value={createForm.clientType}
              onChange={(e) => setCreateForm({ ...createForm, clientType: e.target.value })}
            >
              {CLIENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Redirect URIs</label>
            <ChipInput
              values={createForm.redirectUris}
              onChange={(redirectUris) => setCreateForm({ ...createForm, redirectUris })}
              placeholder="https://app.example/callback"
            />
          </div>
          <div className="field">
            <label>Scopes</label>
            <textarea
              className="textarea"
              value={createForm.scopes}
              onChange={(e) => setCreateForm({ ...createForm, scopes: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Grant types</label>
            <textarea
              className="textarea"
              value={createForm.authorizationGrantTypes}
              onChange={(e) => setCreateForm({ ...createForm, authorizationGrantTypes: e.target.value })}
            />
            <span className="faint">Allowed: {GRANT_TYPES.join(', ')}</span>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={createForm.requirePkce}
              onChange={(e) => setCreateForm({ ...createForm, requirePkce: e.target.checked })}
            />
            Require PKCE
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={createForm.requireConsent}
              onChange={(e) => setCreateForm({ ...createForm, requireConsent: e.target.checked })}
            />
            Require consent
          </label>
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
