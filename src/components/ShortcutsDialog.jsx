import { useAuth } from '../auth/AuthContext';
import { hasDirectoryAdminRole } from '../utils/destinations';
import { Modal } from './Modal';

const ADMIN_ROWS = [
  { keys: 'Ctrl/Cmd + K', action: 'Open command palette' },
  { keys: '/', action: 'Focus topbar search' },
  { keys: '?', action: 'Show keyboard shortcuts' },
  { keys: 'Esc', action: 'Close palette, dialog, or drawer' },
];

const USER_ROWS = [
  { keys: 'Ctrl/Cmd + K', action: 'Open command palette' },
  { keys: '?', action: 'Show keyboard shortcuts' },
  { keys: 'Esc', action: 'Close palette, dialog, or drawer' },
];

export function ShortcutsDialog({ open, onClose }) {
  const { user } = useAuth();
  if (!open) return null;
  const rows = hasDirectoryAdminRole(user) ? ADMIN_ROWS : USER_ROWS;
  return (
    <Modal
      title="Keyboard shortcuts"
      subtitle={hasDirectoryAdminRole(user) ? 'Available in the admin console.' : 'Available for your account settings.'}
      onClose={onClose}
    >
      <table className="shortcut-table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.keys}>
              <td>
                <kbd>{row.keys}</kbd>
              </td>
              <td>{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
