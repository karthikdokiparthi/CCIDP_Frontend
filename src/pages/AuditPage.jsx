import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchAudit } from '../api/admin';
import { extractError } from '../api/client';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { RelativeTime } from '../components/RelativeTime';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { AUDIT_EVENT_TYPES } from '../utils/constants';
import { downloadText, toCsv } from '../utils/csv';
import { shortId } from '../utils/format';

const EXPORT_COLUMNS = ['createdAt', 'eventType', 'outcome', 'principal', 'ipAddress', 'detail'];
const EXPORT_CAP = 500;
const EXPORT_PAGE_SIZE = 100;

export function AuditPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const eventType = searchParams.get('eventType') || '';
  const userId = searchParams.get('userId') || '';
  const [userIdInput, setUserIdInput] = useState(userId);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  function writeFilters(nextType, nextUserId, nextPage = 0) {
    const params = new URLSearchParams();
    if (nextType) params.set('eventType', nextType);
    if (nextUserId?.trim()) params.set('userId', nextUserId.trim());
    setSearchParams(params, { replace: true });
    setPage(nextPage);
  }

  async function load(nextType = eventType, nextUserId = userId, nextPage = page, nextSize = pageSize) {
    setLoading(true);
    setError('');
    try {
      setData(
        await searchAudit({
          eventType: nextType || undefined,
          userId: nextUserId.trim() || undefined,
          page: nextPage,
          size: nextSize,
        })
      );
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setUserIdInput(userId);
    setPage(0);
    load(eventType, userId, 0);
  }, [eventType, userId]);

  async function exportCsv() {
    setExporting(true);
    try {
      const rows = [];
      let nextPage = 0;
      let totalPages = 1;
      while (rows.length < EXPORT_CAP && nextPage < totalPages) {
        const result = await searchAudit({
          eventType: eventType || undefined,
          userId: userId.trim() || undefined,
          page: nextPage,
          size: EXPORT_PAGE_SIZE,
        });
        rows.push(...(result.content || []));
        totalPages = Math.max(result.totalPages || 1, 1);
        nextPage += 1;
        if (!result.content?.length) break;
      }
      const limited = rows.slice(0, EXPORT_CAP);
      downloadText(
        `ccidp-audit-${new Date().toISOString().slice(0, 10)}.csv`,
        toCsv(limited, EXPORT_COLUMNS)
      );
      toast.success(`Exported ${limited.length} audit event${limited.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Audit"
        description="Immutable identity events. Filter by event type or user ID."
        actions={
          <button className="btn" type="button" disabled={exporting} onClick={exportCsv}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        }
      />
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          writeFilters(eventType, userIdInput, 0);
        }}
      >
        <select
          className="select"
          value={eventType}
          onChange={(e) => writeFilters(e.target.value, userIdInput, 0)}
        >
          <option value="">All event types</option>
          {AUDIT_EVENT_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          className="input search"
          placeholder="User ID (UUID)"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
        />
        <button className="btn" type="submit">
          Apply
        </button>
      </form>
      <div className="panel">
        <DataTable
          rows={data.content}
          loading={loading}
          error={error}
          onRetry={() => load()}
          emptyTitle="No audit events"
          emptyDescription="No events match the current filters."
          columns={[
            {
              key: 'createdAt',
              header: 'Time',
              render: (row) => <RelativeTime value={row.createdAt} />,
            },
            { key: 'eventType', header: 'Event' },
            {
              key: 'outcome',
              header: 'Outcome',
              render: (row) => <StatusBadge value={row.outcome} />,
            },
            { key: 'principal', header: 'Principal' },
            {
              key: 'userId',
              header: 'User',
              render: (row) => <span className="mono">{shortId(row.userId)}</span>,
            },
            { key: 'ipAddress', header: 'IP', render: (row) => <span className="mono">{row.ipAddress || '—'}</span> },
            { key: 'detail', header: 'Detail', render: (row) => row.detail || '—' },
          ]}
        />
        <Pagination
          page={data.number ?? page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
            load(eventType, userId, 0, size);
          }}
          onPageChange={(next) => {
            setPage(next);
            load(eventType, userId, next, pageSize);
          }}
        />
      </div>
    </>
  );
}
