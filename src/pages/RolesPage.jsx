import { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  assignRolePermission,
  createRole,
  deleteRole,
  getRolePermissions,
  getRole,
  listPermissions,
  removeRolePermission,
  searchRoles,
  updateRole,
} from '../api/admin';
import { extractError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { formatDateTime, formatNumber } from '../utils/format';
import { setQueryParam } from '../utils/query';

const EMPTY = { name: '', description: '' };

export function RolesPage() {
  const toast = useToast();
  const { setCrumbExtra } = useOutletContext() || {};
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [permissionId, setPermissionId] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  async function load(nextPage = page, nextSize = pageSize) {
    setLoading(true);
    setError('');
    try {
      setData(await searchRoles({ page: nextPage, size: nextSize }));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    listPermissions()
      .then((list) => setCatalog(list || []))
      .catch(() => setCatalog([]));
  }, []);

  useEffect(() => {
    const roleId = searchParams.get('roleId');
    if (!roleId) {
      setSelected(null);
      setAssigned([]);
      return undefined;
    }
    let cancelled = false;
    getRole(roleId)
      .then((row) => {
        if (cancelled || !row) return null;
        setSelected(row);
        setNotice('');
        setFormError('');
        setPermissionId('');
        return getRolePermissions(row.id);
      })
      .then((perms) => {
        if (!cancelled && perms) setAssigned(perms);
      })
      .catch((err) => {
        if (!cancelled) setFormError(extractError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    setCrumbExtra?.(selected?.name || null);
    return () => setCrumbExtra?.(null);
  }, [selected, setCrumbExtra]);

  async function openRole(row) {
    if (!row?.id) {
      setSelected(null);
      setAssigned([]);
    }
    setQueryParam(setSearchParams, 'roleId', row?.id || null);
  }

  async function refreshDetail(roleId) {
    setAssigned((await getRolePermissions(roleId)) || []);
    await load();
    const next = await searchRoles({ page, size: pageSize });
    const updated = (next.content || []).find((item) => item.id === roleId);
    if (updated) setSelected(updated);
  }

  async function save() {
    setBusy(true);
    setFormError('');
    try {
      if (editing?.id) {
        await updateRole(editing.id, form);
      } else {
        await createRole(form);
      }
      setEditing(null);
      toast.success(editing?.id ? 'Role updated' : 'Role created');
      await load();
    } catch (err) {
      setFormError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function run(action, successMessage, { refresh = true } = {}) {
    setBusy(true);
    setFormError('');
    setNotice('');
    try {
      await action();
      if (successMessage) {
        setNotice(successMessage);
        toast.success(successMessage);
      }
      if (refresh && selected) await refreshDetail(selected.id);
      return true;
    } catch (err) {
      setFormError(extractError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const assignedIds = new Set(assigned.map((item) => item.permissionId));
  const available = catalog.filter((item) => !assignedIds.has(item.id));

  return (
    <>
      <PageHeader
        title="Roles"
        description="Roles granted to directory users. Open a role to assign permissions."
        actions={
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setFormError('');
              setEditing({ id: null });
            }}
          >
            Create role
          </button>
        }
      />
      <div className="panel">
        <DataTable
          rows={data.content}
          loading={loading}
          error={error}
          onRetry={() => load()}
          onRowClick={openRole}
          emptyTitle="No roles"
          emptyDescription="Create a role to begin assigning access."
          columns={[
            {
              key: 'name',
              header: 'Role',
              render: (row) => (
                <div className="cell-stack">
                  <div className="primary">{row.name}</div>
                  <div className="secondary">{row.description || 'No description'}</div>
                </div>
              ),
            },
            { key: 'userCount', header: 'Users', render: (row) => formatNumber(row.userCount) },
            {
              key: 'permissionCount',
              header: 'Permissions',
              render: (row) => formatNumber(row.permissionCount),
            },
            {
              key: 'updatedAt',
              header: 'Updated',
              render: (row) => <span className="mono">{formatDateTime(row.updatedAt)}</span>,
            },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setForm({ name: row.name, description: row.description || '' });
                    setFormError('');
                    setEditing(row);
                  }}
                >
                  Edit
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
            load(0, size);
          }}
          onPageChange={(next) => {
            setPage(next);
            load(next);
          }}
        />
      </div>

      {selected ? (
        <Drawer
          title={selected.name}
          subtitle={`${formatNumber(selected.userCount)} users · ${formatNumber(selected.permissionCount ?? assigned.length)} permissions`}
          onClose={() => openRole(null)}
        >
          {formError ? <div className="form-error">{formError}</div> : null}
          {notice ? <div className="form-ok">{notice}</div> : null}
          <p className="muted">{selected.description || 'No description'}</p>

          <div className="section-title">Assigned permissions</div>
          {assigned.length ? (
            <ul className="assignment-list">
              {assigned.map((item) => (
                <li key={item.permissionId}>
                  <div>
                    <div className="mono">{item.permissionName}</div>
                    <div className="secondary faint">{item.permissionDescription || ''}</div>
                  </div>
                  <button
                    className="btn btn-sm"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setConfirm({
                        title: 'Remove permission',
                        message: `Remove ${item.permissionName} from ${selected.name}?`,
                        confirmLabel: 'Remove',
                        danger: true,
                        action: () =>
                          run(
                            () => removeRolePermission(selected.id, item.permissionId),
                            'Permission removed'
                          ),
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No permissions assigned.</p>
          )}

          <div className="section-title">Grant permission</div>
          <div className="toolbar">
            <select
              className="select"
              value={permissionId}
              onChange={(e) => setPermissionId(e.target.value)}
            >
              <option value="">Select permission</option>
              {available.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-sm"
              type="button"
              disabled={busy || !permissionId}
              onClick={() =>
                run(async () => {
                  await assignRolePermission(selected.id, permissionId);
                  setPermissionId('');
                }, 'Permission assigned')
              }
            >
              Assign
            </button>
          </div>

          <div className="section-title">Danger zone</div>
          <button
            className="btn btn-sm btn-danger"
            type="button"
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Delete role',
                message: `Delete ${selected.name}? Users currently assigned this role will lose it.`,
                confirmLabel: 'Delete role',
                danger: true,
                action: async () => {
                  const ok = await run(() => deleteRole(selected.id), 'Role deleted', {
                    refresh: false,
                  });
                  if (ok) openRole(null);
                },
              })
            }
          >
            Delete role
          </button>
        </Drawer>
      ) : null}

      {editing ? (
        <Modal
          title={editing.id ? 'Edit role' : 'Create role'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" disabled={busy} onClick={save}>
                Save
              </button>
            </>
          }
        >
          {formError ? <div className="form-error">{formError}</div> : null}
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              className="textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
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
