import { useRef, useState } from 'react';

function splitTokens(raw) {
  return String(raw || '')
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function ChipInput({ values = [], onChange, placeholder = 'Add and press Enter' }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const list = Array.isArray(values) ? values : [];

  function addFrom(raw) {
    const tokens = splitTokens(raw);
    if (!tokens.length) return;
    const next = [...list];
    tokens.forEach((token) => {
      if (!next.includes(token)) next.push(token);
    });
    onChange(next);
    setDraft('');
  }

  return (
    <div
      className="chip-input"
      onClick={() => inputRef.current?.focus()}
    >
      {list.map((item) => (
        <span className="uri-chip" key={item}>
          <span className="mono">{item}</span>
          <button
            className="chip-remove"
            type="button"
            aria-label={`Remove ${item}`}
            onClick={(event) => {
              event.stopPropagation();
              onChange(list.filter((value) => value !== item));
            }}
          >
            Remove
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="chip-field"
        value={draft}
        placeholder={list.length ? '' : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addFrom(draft);
          }
          if (event.key === 'Backspace' && !draft && list.length) {
            onChange(list.slice(0, -1));
          }
        }}
        onBlur={() => addFrom(draft)}
      />
    </div>
  );
}
