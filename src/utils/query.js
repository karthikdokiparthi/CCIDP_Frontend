export function setQueryParam(setSearchParams, key, value) {
  setSearchParams(
    (prev) => {
      const next = new URLSearchParams(prev);
      if (value == null || value === '') next.delete(key);
      else next.set(key, String(value));
      return next;
    },
    { replace: true }
  );
}
