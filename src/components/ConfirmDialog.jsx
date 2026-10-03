import { useEffect, useRef } from 'react';
import { Icon } from './Icons';
import { Portal } from './Portal';
import { dismissFromOverlay, useOverlayDismiss } from './useOverlayDismiss';

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}) {
  const confirmRef = useRef(null);
  const titleId = 'confirm-title';
  const descId = 'confirm-desc';

  useOverlayDismiss(onClose, { busy });

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <Portal>
      <div
        className="overlay overlay-modal"
        onClick={busy ? undefined : (event) => dismissFromOverlay(event, onClose)}
      >
        <div
          className="modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <div className="modal-header">
            <div>
              <h2 id={titleId}>{title}</h2>
            </div>
            <button
              className="btn btn-ghost btn-sm overlay-close"
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <div className="modal-body">
            <p id={descId} className="confirm-copy">
              {message}
            </p>
          </div>
          <div className="modal-foot">
            <button className="btn" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              ref={confirmRef}
              className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
              type="button"
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
