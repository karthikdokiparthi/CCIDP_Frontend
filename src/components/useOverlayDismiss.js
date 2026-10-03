import { useEffect, useRef } from 'react';

const stack = [];

export function useOverlayDismiss(onClose, { enabled = true, busy = false } = {}) {
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (!enabled) return undefined;
    const entry = { id: Symbol('overlay') };
    stack.push(entry);

    function onKey(event) {
      if (event.key !== 'Escape') return;
      if (stack[stack.length - 1] !== entry) return;
      if (busyRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onCloseRef.current();
    }

    window.addEventListener('keydown', onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      const index = stack.lastIndexOf(entry);
      if (index >= 0) stack.splice(index, 1);
      window.removeEventListener('keydown', onKey, true);
      if (!stack.length) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [enabled]);
}

export function dismissFromOverlay(event, onClose) {
  if (event.target === event.currentTarget) {
    onClose();
  }
}
