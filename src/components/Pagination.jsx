import { PAGE_SIZES } from '../utils/paging';

export function Pagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
  pageSize,
  onPageSizeChange,
}) {
  const current = (page ?? 0) + 1;
  const pages = Math.max(totalPages || 0, 1);

  return (
    <div className="pagination">
      <span>
        {totalElements ?? 0} record{(totalElements ?? 0) === 1 ? '' : 's'}
      </span>
      <div className="pagination-controls">
        {onPageSizeChange ? (
          <label className="page-size">
            <span className="sr-only">Rows per page</span>
            <select
              className="select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          className="btn btn-sm"
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {current} of {pages}
        </span>
        <button
          className="btn btn-sm"
          type="button"
          disabled={page + 1 >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
