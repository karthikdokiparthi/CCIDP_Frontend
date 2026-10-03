import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasDirectoryAdminRole, homePath } from '../utils/destinations';
import { shortId } from '../utils/format';

const SECTIONS = [
  { prefix: '/', label: 'Dashboard', end: true },
  { prefix: '/users', label: 'Users' },
  { prefix: '/roles', label: 'Roles' },
  { prefix: '/permissions', label: 'Permissions' },
  { prefix: '/applications', label: 'Applications' },
  { prefix: '/sessions', label: 'Sessions' },
  { prefix: '/audit', label: 'Audit' },
  { prefix: '/system', label: 'System' },
  { prefix: '/account', label: 'Settings' },
];

export function Breadcrumbs({ extra }) {
  const { user } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const section =
    SECTIONS.find((item) =>
      item.end ? location.pathname === '/' : location.pathname.startsWith(item.prefix)
    ) || SECTIONS[0];

  const crumbs = [
    { label: 'CCIDP', to: homePath(user) },
    { label: section.label, to: hasDirectoryAdminRole(user) || section.prefix === '/account' ? section.prefix : homePath(user) },
  ];

  const userId = params.get('userId');
  const clientId = params.get('clientId');
  const roleId = params.get('roleId');
  const permissionId = params.get('permissionId');

  if (section.prefix === '/users' && (extra || userId)) {
    crumbs.push({ label: extra || shortId(userId) });
  } else if (section.prefix === '/applications' && (extra || clientId)) {
    crumbs.push({ label: extra || shortId(clientId) });
  } else if (section.prefix === '/roles' && (extra || roleId)) {
    crumbs.push({ label: extra || shortId(roleId) });
  } else if (section.prefix === '/permissions' && (extra || permissionId)) {
    crumbs.push({ label: extra || shortId(permissionId) });
  } else if (section.prefix === '/audit' && userId) {
    crumbs.push({ label: extra || 'User' });
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${index}`} className="crumb">
            {index > 0 ? <span className="crumb-sep">/</span> : null}
            {last || !crumb.to ? (
              <span className={last ? 'crumb-current' : undefined}>{crumb.label}</span>
            ) : (
              <Link to={crumb.to}>{crumb.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
