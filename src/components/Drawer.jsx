import { Icon } from './Icons';
import { Portal } from './Portal';
import { dismissFromOverlay, useOverlayDismiss } from './useOverlayDismiss';

function CloseButton({ onClose, disabled }) {
  return (
    <button
      className="btn btn-ghost btn-sm overlay-close"
      type="button"
      onClick={onClose}
      disabled={disabled}
      aria-label="Close"
    >
      <Icon name="close" size={16} />
    </button>
  );
}

export function Drawer({ title, subtitle, onClose, children, footer }) {
  useOverlayDismiss(onClose);

  return (
    <Portal>
      <div
        className="overlay overlay-drawer"
        onClick={(event) => dismissFromOverlay(event, onClose)}
      >
        <aside
          className="drawer"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="drawer-header">
            <div>
              <h2>{title}</h2>
              {subtitle ? <p className="muted">{subtitle}</p> : null}
            </div>
            <CloseButton onClose={onClose} />
          </div>
          <div className="drawer-body">{children}</div>
          {footer ? <div className="drawer-foot">{footer}</div> : null}
        </aside>
      </div>
    </Portal>
  );
}

export function Modal({ title, subtitle, onClose, children, footer }) {
  useOverlayDismiss(onClose);

  return (
    <Portal>
      <div
        className="overlay overlay-modal"
        onClick={(event) => dismissFromOverlay(event, onClose)}
      >
        <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
          <div className="modal-header">
            <div>
              <h2>{title}</h2>
              {subtitle ? <p className="muted">{subtitle}</p> : null}
            </div>
            <CloseButton onClose={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          {footer ? <div className="modal-foot">{footer}</div> : null}
        </div>
      </div>
    </Portal>
  );
}
