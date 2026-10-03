import { Icon } from './Icons';
import { useToast } from './Toast';

function fallbackCopy(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.left = '-9999px';
  document.body.appendChild(field);
  field.select();
  const ok = document.execCommand('copy');
  field.remove();
  if (!ok) {
    throw new Error('Copy failed');
  }
}

export async function copyText(value) {
  const text = String(value ?? '');
  if (!text) {
    throw new Error('Nothing to copy');
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to execCommand
    }
  }
  fallbackCopy(text);
}

export function CopyButton({ value, label = 'Copy' }) {
  const toast = useToast();

  async function onCopy(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!value) return;
    try {
      await copyText(value);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  }

  return (
    <button
      className="btn btn-ghost btn-sm copy-btn"
      type="button"
      onClick={onCopy}
      aria-label={label}
      title={label}
    >
      <Icon name="copy" size={14} />
    </button>
  );
}

export function CopyableId({ value, display, label = 'Copy ID' }) {
  if (!value) return '—';
  return (
    <span className="copyable">
      <span className="mono">{display || value}</span>
      <CopyButton value={value} label={label} />
    </span>
  );
}
