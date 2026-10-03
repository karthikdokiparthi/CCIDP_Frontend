import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchClients, searchUsers } from '../api/admin';
import { debounce, displayName } from '../utils/format';
import { useAuth } from '../auth/AuthContext';
import { hasDirectoryAdminRole, visibleDestinations } from '../utils/destinations';
import { Icon } from './Icons';
import { Portal } from './Portal';
import { dismissFromOverlay, useOverlayDismiss } from './useOverlayDismiss';

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canSearchDirectory = hasDirectoryAdminRole(user);
  const pages = visibleDestinations(user);
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [active, setActive] = useState(0);

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
          if (!canSearchDirectory) {
            setUsers([]);
            setClients([]);
            return;
          }
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
    [canSearchDirectory]
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setUsers([]);
      setClients([]);
      setActive(0);
      return undefined;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const destinations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (item) => item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q)
    );
  }, [query, pages]);

  const items = useMemo(() => {
    const list = destinations.map((item) => ({
      key: `nav-${item.to}`,
      kind: 'page',
      label: item.label,
      hint: item.hint,
      icon: item.icon,
      to: item.to,
    }));
    if (query.trim() && canSearchDirectory) {
      users.forEach((user) => {
        list.push({
          key: `user-${user.id}`,
          kind: 'user',
          label: displayName(user),
          hint: user.username,
          icon: 'users',
          to: `/users?userId=${user.id}`,
        });
      });
      clients.forEach((client) => {
        list.push({
          key: `client-${client.id}`,
          kind: 'app',
          label: client.clientName,
          hint: client.clientId,
          icon: 'apps',
          to: `/applications?clientId=${client.id}`,
        });
      });
    }
    return list;
  }, [destinations, users, clients, query, canSearchDirectory]);

  useEffect(() => {
    setActive(0);
  }, [query, users, clients]);

  const go = useCallback(
    (path) => {
      onClose();
      navigate(path);
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (!items.length) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((index) => (index + 1) % items.length);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((index) => (index - 1 + items.length) % items.length);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const item = items[active] || items[0];
        if (item) go(item.to);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, active, go]);

  useOverlayDismiss(onClose, { enabled: open });

  if (!open) return null;

  const empty = !loading && query.trim() && items.length === 0;

  return (
    <Portal>
      <div
        className="overlay overlay-modal command-overlay"
        onClick={(event) => dismissFromOverlay(event, onClose)}
      >
        <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          className="input command-input"
          placeholder={canSearchDirectory ? 'Go to a page, user, or application' : 'Go to Settings'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            runSearch(e.target.value);
          }}
          autoComplete="off"
        />
        <div className="command-list" role="listbox">
          {loading ? <div className="search-empty">Searching…</div> : null}
          {items.map((item, index) => (
            <button
              key={item.key}
              className={`search-hit command-hit${index === active ? ' is-active' : ''}`}
              type="button"
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(item.to)}
            >
              <Icon name={item.icon} />
              <span className="command-copy">
                <span>{item.label}</span>
                <span className="muted">{item.hint}</span>
              </span>
              <span className="command-kind">{item.kind}</span>
            </button>
          ))}
          {empty ? (
            <div className="search-empty">
              {canSearchDirectory ? 'No matching pages, users, or applications.' : 'No matching pages.'}
            </div>
          ) : null}
        </div>
        <div className="command-foot">
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
      </div>
    </Portal>
  );
}
