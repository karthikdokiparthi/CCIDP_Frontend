import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Portal } from './Portal';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((list) => {
      if (list.some((item) => item.type === type && item.message === message)) {
        return list;
      }
      return [...list.slice(-4), { id, type, message }];
    });
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <SessionExpiryListener />
      <Portal>
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <span>{toast.message}</span>
            <button
              className="toast-dismiss"
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              Close
            </button>
          </div>
        ))}
      </div>
      </Portal>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function SessionExpiryListener() {
  const toast = useToast();
  useEffect(() => {
    function onExpired() {
      toast.error('Session expired. Sign in again.');
    }
    window.addEventListener('ccidp:session-expired', onExpired);
    return () => window.removeEventListener('ccidp:session-expired', onExpired);
  }, [toast]);
  return null;
}
