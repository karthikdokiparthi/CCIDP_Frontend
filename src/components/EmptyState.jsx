export function EmptyState({ title = 'No records', description = 'Nothing matches the current filters.' }) {
  return (
    <div className="state-block">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
