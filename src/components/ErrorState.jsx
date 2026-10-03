export function ErrorState({ message = 'Unable to load data', onRetry }) {
  return (
    <div className="state-block">
      <h3>Request failed</h3>
      <p>{message}</p>
      {onRetry ? (
        <button className="btn" type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
