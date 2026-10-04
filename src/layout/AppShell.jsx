import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BrandLockup } from '../components/BrandLockup';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CommandPalette } from '../components/CommandPalette';
import { GlobalSearch } from '../components/GlobalSearch';
import { Icon } from '../components/Icons';
import { ShortcutsDialog } from '../components/ShortcutsDialog';
import { ThemeToggle } from '../components/ThemeToggle';
import { useOverlayDismiss } from '../components/useOverlayDismiss';
import { hasDirectoryAdminRole, visibleDestinations } from '../utils/destinations';
import { displayName, initials } from '../utils/format';

function isTypingTarget(target) {
  if (!target || typeof target !== 'object') return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [crumbExtra, setCrumbExtra] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navItems = visibleDestinations(user);

  useEffect(() => {
    setNavOpen(false);
    setCrumbExtra(null);
  }, [location.pathname]);

  useOverlayDismiss(() => setNavOpen(false), { enabled: navOpen });

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShortcutsOpen(false);
        setPaletteOpen((open) => !open);
        return;
      }
      if (paletteOpen || shortcutsOpen || isTypingTarget(event.target)) {
        return;
      }
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (!hasDirectoryAdminRole(user)) {
          return;
        }
        event.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      if (event.key === '?') {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, shortcutsOpen, user]);

  return (
    <div className="shell">
      <div
        className={`sidebar-overlay${navOpen ? ' is-open' : ''}`}
        onClick={() => setNavOpen(false)}
      />
      <aside className={`sidebar${navOpen ? ' is-open' : ''}`} id="app-sidebar">
        <div className="sidebar-brand">
          <BrandLockup />
          <button
            className="btn btn-ghost btn-sm sidebar-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            Close
          </button>
        </div>
        <nav className="nav" aria-label="Console">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
          <button className="nav-item nav-logout" type="button" onClick={logout}>
            <Icon name="logout" />
            Sign out
          </button>
        </nav>
        <div className="sidebar-foot">BrightGrid CCIDP</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-start">
            <button
              className="menu-toggle"
              type="button"
              aria-label="Open navigation"
              aria-controls="app-sidebar"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <Breadcrumbs extra={crumbExtra} />
          </div>
          {hasDirectoryAdminRole(user) ? <GlobalSearch /> : null}
          <div className="topbar-user">
            <ThemeToggle />
            <div className="user-meta">
              <div className="name">{displayName(user)}</div>
              <div className="email">{user?.username}</div>
            </div>
            <div className="avatar">{initials(user)}</div>
            <button
              className="btn btn-sm topbar-signout"
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={logout}
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet context={{ setCrumbExtra }} />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
