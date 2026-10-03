import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  createPermission,
  deletePermission,
  getPermission,
  getRolePermissions,
  listPermissions,
  listRoles,
  updatePermission,
} from '../api/admin';
import { extractError } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { formatDateTime } from '../utils/format';
import { setQueryParam } from '../utils/query';

const EMPTY = { name: '', description: '' };

export function PermissionsPage() {
  const toast = useToast();
  const { setCrumbExtra } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [roleIndex, setRoleIndex] = useState([]);
  const [selected, setSelected] = useState(null);

  async function loadRoleIndex() {
    try {
      const roles = (await listRoles()) || [];
      const assignments = await Promise.all(
        roles.map(async (role) => {
          try {
            const perms = (await getRolePermissions(role.id)) || [];
            return {
              role,
              permissionIds: new Set(perms.map((item) => item.permissionId)),
            };
          } catch {
            return { role, permissionIds: new Set() };
          }
        })
      );
      setRoleIndex(assignments);
    } catch {
      setRoleIndex([]);
    }
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      setRows((await listPermissions()) || []);
      await loadRoleIndex();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const id = searchParams.get('permissionId');
    if (!id) {
      setSelected(null);
      return undefined;
    }
    let cancelled = false;
    getPermission(id)
      .then((row) => {
        if (!cancelled) setSelected(row);
      })
      .catch(() => {
        if (!cancelled) setSelected(null);
      });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    setCrumbExtra?.(selected?.name || null);
    return () => setCrumbExtra?.(null);
  }, [selected, setCrumbExtra]);

  function openPermission(row) {
    if (!row?.id) setSelected(null);
    setQueryParam(setSearchParams, 'permissionId', row?.id || null);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name?.toLowerCase().includes(q) ||
        row.description?.toLowerCase().includes(q)
    );
  }, [rows, query]);

  function rolesFor(permissionId) {
    return roleIndex
      .filter((item) => item.permissionIds.has(permissionId))
      .map((item) => item.role);
  }

  async function save() {
    setBusy(true);
    setFormError('');
    try {
      if (editing?.id) {
        await updatePermission(editing.id, form);
      } else {
        await createPermission(form);
      }
      setEditing(null);
      setForm(EMPTY);
      toast.success(editing?.id ? 'Permission updated' : 'Permission created');
      await load();
    } catch (err) {
      setFormError(extractError(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deletePermission(pendingDelete.id);
      toast.success('Permission deleted');
      setPendingDelete(null);
      if (selected?.id === pendingDelete.id) openPermission(null);
      await load();
    } catch (err) {
      const message = extractError(err);
      setError(message);
      toast.error(message);
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  }

  const selectedRoles = selected ? rolesFor(selected.id) : [];

  return (
    <>
      <PageHeader
        title="Permissions"
        description="Named authorities granted to roles. Open a permission to see which roles currently grant it."
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
            Create permission
          </button>
        }
      />
      <div className="toolbar">
        <input
          className="input search"
          placeholder="Filter by name or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="panel">
        <DataTable
          rows={filtered}
          loading={loading}
          error={error}
          onRetry={load}
          onRowClick={openPermission}
          emptyTitle="No permissions"
          emptyDescription="Create a permission, then attach it to a role."
          columns={[
            {
              key: 'name',
              header: 'Permission',
              render: (row) => (
                <div className="cell-stack">
                  <div className="primary mono">{row.name}</div>
                  <div className="secondary">{row.description || 'No description'}</div>
                </div>
              ),
            },
            {
              key: 'roles',
              header: 'Granted to',
              render: (row) => {
                const roles = rolesFor(row.id);
                if (!roles.length) return <span className="faint">No roles</span>;
                return (
                  <div className="badge-row">
                    {roles.slice(0, 3).map((role) => (
                      <span className="badge" key={role.id}>
                        {role.name}
                      </span>
                    ))}
                    {roles.length > 3 ? <span className="faint">+{roles.length - 3}</span> : null}
                  </div>
                );
              },
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
                <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => {
                      setForm({ name: row.name, description: row.description || '' });
                      setFormError('');
                      setEditing(row);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    type="button"
                    onClick={() => setPendingDelete(row)}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {selected ? (
        <Drawer
          title={selected.name}
          subtitle={selected.description || 'No description'}
          onClose={() => openPermission(null)}
        >
          <div className="section-title">Roles with this permission</div>
          {selectedRoles.length ? (
            <ul className="assignment-list">
              {selectedRoles.map((role) => (
                <li key={role.id}>
                  <div>
                    <div className="primary">{role.name}</div>
                    <div className="secondary faint">{role.description || ''}</div>
                  </div>
                  <Link className="btn btn-sm" to={`/roles?roleId=${role.id}`}>
                    Open role
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No roles currently grant this permission.</p>
          )}
        </Drawer>
      ) : null}

      {editing ? (
        <Modal
          title={editing.id ? 'Edit permission' : 'Create permission'}
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
              placeholder="USER_READ"
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

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete permission"
          message={`Delete ${pendingDelete.name}? Roles that currently grant this permission will lose it.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          onClose={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </>
  );
}
