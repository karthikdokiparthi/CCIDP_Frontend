import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchClients, searchUsers } from '../api/admin';
import { debounce, displayName } from '../utils/format';

export function GlobalSearch() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);

  const runSearch = useMemo(
    () =>
      debounce(async (value) => {
        const q = value.trim();
        if (!q) {
          setUsers([]);
          setClients([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const [userPage, clientPage] = await Promise.all([
            searchUsers({ q, size: 5 }),
            searchClients({ q, size: 5 }),
          ]);
          setUsers(userPage?.content || []);
          setClients(clientPage?.content || []);
        } catch {
          setUsers([]);
          setClients([]);
        } finally {
          setLoading(false);
        }
      }, 250),
    []
  );

  useEffect(() => {
    function onClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  function go(path) {
    setOpen(false);
    setQuery('');
    setUsers([]);
    setClients([]);
    navigate(path);
  }

  const showPanel = open && query.trim().length > 0;
  const empty = !loading && users.length === 0 && clients.length === 0;

  return (
    <div className="global-search" ref={rootRef}>
      <label className="sr-only" htmlFor="global-search">
        Search users and applications
      </label>
      <input
        id="global-search"
        className="input"
        placeholder="Search users and applications"
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          setOpen(value.trim().length > 0);
          runSearch(value);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        autoComplete="off"
      />
      {showPanel ? (
        <div className="search-panel" role="listbox" aria-label="Search results">
          {loading ? <div className="search-empty">Searching…</div> : null}
          {!loading && users.length ? (
            <div className="search-group">
              <div className="search-label">Users</div>
              {users.map((user) => (
                <button
                  key={user.id}
                  className="search-hit"
                  type="button"
                  onClick={() => go(`/users?userId=${user.id}`)}
                >
                  <span>{displayName(user)}</span>
                  <span className="muted">{user.username}</span>
                </button>
              ))}
            </div>
          ) : null}
          {!loading && clients.length ? (
            <div className="search-group">
              <div className="search-label">Applications</div>
              {clients.map((client) => (
                <button
                  key={client.id}
                  className="search-hit"
                  type="button"
                  onClick={() => go(`/applications?clientId=${client.id}`)}
                >
                  <span>{client.clientName}</span>
                  <span className="muted mono">{client.clientId}</span>
                </button>
              ))}
            </div>
          ) : null}
          {empty ? <div className="search-empty">No matching users or applications.</div> : null}
        </div>
      ) : null}
    </div>
  );
}
