import { useState } from 'react';
import {
  getStoredApiBaseUrl,
  needsExplicitApiHost,
  setStoredApiBaseUrl,
} from '../api/client';

export function ApiBaseField() {
  const [value, setValue] = useState(() => getStoredApiBaseUrl());

  if (!needsExplicitApiHost()) {
    return null;
  }

  return (
    <details className="api-base-details">
      <summary>Identity provider URL</summary>
      <div className="field">
        <label htmlFor="ccidp-api-base">Public API (ends with /ccidp)</label>
        <input
          id="ccidp-api-base"
          className="input"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            setStoredApiBaseUrl(next);
          }}
          placeholder="https://your-api-host/ccidp"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </details>
  );
}
