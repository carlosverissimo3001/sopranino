'use client';

import { useEffect, useState } from 'react';
import { Bug, Inbox, Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FilterChip } from '@/components/admin/FilterChip';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminFeedback } from '@/hooks/admin/useAdminFeedback';
import { useAdminUpdateFeedback } from '@/hooks/admin/useAdminUpdateFeedback';
import { FeedbackDtoKindEnum as Kind, type FeedbackDto } from '@/sdk';

const PAGE_SIZE = 20;

type Status = 'open' | 'resolved' | 'all';

export function ReportsAdmin() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>('open');
  const [kind, setKind] = useState<Kind | null>(null);

  useEffect(() => {
    setPage(1);
  }, [status, kind]);

  const { data, isLoading, error } = useAdminFeedback({
    page,
    limit: PAGE_SIZE,
    kind: kind ?? undefined,
    resolved: status === 'all' ? undefined : status === 'resolved',
  });
  const update = useAdminUpdateFeedback();

  const reports = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Inbox className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-fg">Reports</h2>
        {meta && (
          <span className="text-xs text-fg/40">({meta.totalItems})</span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-fg/10 bg-fg/5 p-1">
          {(['open', 'resolved', 'all'] as const).map((value) => (
            <FilterChip
              key={value}
              isActive={status === value}
              onClick={() => setStatus(value)}
              activeClasses="bg-fg/[0.14] text-fg"
            >
              {value === 'open'
                ? 'Open'
                : value === 'resolved'
                  ? 'Resolved'
                  : 'All'}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full border border-fg/10 bg-fg/5 p-1">
          <FilterChip
            isActive={kind === Kind.Bug}
            onClick={() => setKind(kind === Kind.Bug ? null : Kind.Bug)}
            activeClasses="bg-red-500/15 text-red-300"
          >
            Bugs
          </FilterChip>
          <FilterChip
            isActive={kind === Kind.Suggestion}
            onClick={() =>
              setKind(kind === Kind.Suggestion ? null : Kind.Suggestion)
            }
            activeClasses="bg-amber-500/15 text-amber-300"
          >
            Ideas
          </FilterChip>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
          Failed to load reports.
        </div>
      )}

      {isLoading && (
        <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-spotify-green" />
      )}

      {!isLoading && !error && reports.length === 0 && (
        <p className="py-10 text-center text-sm text-fg/50">
          {status === 'open' ? 'Nothing open.' : 'No reports here.'}
        </p>
      )}

      <ul className="space-y-2">
        {reports.map((report) => (
          <ReportRow
            key={report.id}
            report={report}
            isUpdating={update.isPending && update.variables?.id === report.id}
            onToggle={() =>
              update.mutate(
                { id: report.id, resolved: !report.resolvedAt },
                { onError: (err) => toast.error(err.message) },
              )
            }
          />
        ))}
      </ul>

      {meta && meta.totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

function ReportRow({
  report,
  isUpdating,
  onToggle,
}: {
  report: FeedbackDto;
  isUpdating: boolean;
  onToggle: () => void;
}) {
  const isBug = report.kind === Kind.Bug;
  const Icon = isBug ? Bug : Lightbulb;

  return (
    <li
      className={`rounded-xl border border-fg/10 bg-fg/[0.03] p-4 ${report.resolvedAt ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-fg/50">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
              isBug
                ? 'bg-red-500/15 text-red-300'
                : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            <Icon className="h-3 w-3" />
            {isBug ? 'Bug' : 'Idea'}
          </span>
          <time dateTime={new Date(report.createdAt).toISOString()}>
            {new Date(report.createdAt).toLocaleString()}
          </time>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={isUpdating}
          className="shrink-0 rounded-full border border-fg/15 px-3 py-1 text-xs font-semibold text-fg/70 transition-colors hover:border-fg/30 hover:text-fg disabled:opacity-50"
        >
          {isUpdating ? '...' : report.resolvedAt ? 'Reopen' : 'Resolve'}
        </button>
      </div>

      {/* Player text, rendered as text. */}
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-fg">
        {report.message}
      </p>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg/45">
        <div className="flex gap-1">
          <dt className="sr-only">From</dt>
          <dd>{report.userDisplayName ?? 'Guest'}</dd>
        </div>
        {report.email && (
          <div className="flex gap-1">
            <dt className="sr-only">Email</dt>
            <dd>
              <a
                href={`mailto:${report.email}`}
                className="text-fg/70 hover:text-fg hover:underline"
              >
                {report.email}
              </a>
            </dd>
          </div>
        )}
        {report.pagePath && (
          <div className="flex gap-1">
            <dt>on</dt>
            <dd className="font-mono">{report.pagePath}</dd>
          </div>
        )}
        {report.appVersion && (
          <div className="flex gap-1">
            <dt className="sr-only">Version</dt>
            <dd className="tabular-nums">v{report.appVersion}</dd>
          </div>
        )}
        {report.userAgent && (
          <div className="flex min-w-0 max-w-full gap-1">
            <dt className="sr-only">Browser</dt>
            <dd className="truncate" title={report.userAgent}>
              {report.userAgent}
            </dd>
          </div>
        )}
      </dl>
    </li>
  );
}
