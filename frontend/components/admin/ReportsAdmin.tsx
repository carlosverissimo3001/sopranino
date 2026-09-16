'use client';

import { useEffect, useState } from 'react';
import { Bug, Inbox, Lightbulb, Loader2, Mic2 } from 'lucide-react';
import { toast } from 'sonner';
import { FilterChip } from '@/components/admin/FilterChip';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminArtistRequests } from '@/hooks/admin/useAdminArtistRequests';
import { useAdminFeedback } from '@/hooks/admin/useAdminFeedback';
import { useAdminUpdateArtistRequests } from '@/hooks/admin/useAdminUpdateArtistRequests';
import { useAdminUpdateFeedback } from '@/hooks/admin/useAdminUpdateFeedback';
import {
  FeedbackDtoKindEnum as Kind,
  type ArtistRequestDto,
  type FeedbackDto,
} from '@/sdk';

const PAGE_SIZE = 20;

const KIND_BADGE: Record<
  Kind,
  { Icon: typeof Bug; label: string; tone: string }
> = {
  [Kind.Bug]: { Icon: Bug, label: 'Bug', tone: 'bg-red-500/15 text-red-300' },
  [Kind.Suggestion]: {
    Icon: Lightbulb,
    label: 'Idea',
    tone: 'bg-amber-500/15 text-amber-300',
  },
  [Kind.ArtistRequest]: {
    Icon: Mic2,
    label: 'Request',
    tone: 'bg-spotify-green/15 text-spotify-green',
  },
};

type Status = 'open' | 'resolved' | 'all';

export function ReportsAdmin() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>('open');
  const [kind, setKind] = useState<Kind | null>(null);
  // Grouped by name rather than listed, so a view rather than a kind filter.
  const [isRequests, setIsRequests] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [status, kind, isRequests]);

  const feedback = useAdminFeedback({
    page,
    limit: PAGE_SIZE,
    kind: kind ?? undefined,
    resolved: status === 'all' ? undefined : status === 'resolved',
  });
  const resolved = status === 'all' ? undefined : status === 'resolved';
  const requests = useAdminArtistRequests(
    { page, limit: PAGE_SIZE, resolved },
    isRequests,
  );
  const update = useAdminUpdateFeedback();
  const updateRequests = useAdminUpdateArtistRequests();

  const { data, isLoading, error } = isRequests ? requests : feedback;
  const reports = isRequests ? [] : (feedback.data?.items ?? []);
  const asked = isRequests ? (requests.data?.items ?? []) : [];
  const meta = data?.meta;
  const isEmpty = !isLoading && !error && reports.length + asked.length === 0;

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
          <FilterChip
            isActive={isRequests}
            onClick={() => {
              setIsRequests(!isRequests);
              setKind(null);
            }}
            activeClasses="bg-spotify-green/15 text-spotify-green"
          >
            Requests
          </FilterChip>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
          Failed to load {isRequests ? 'requests' : 'reports'}.
        </div>
      )}

      {isLoading && (
        <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-spotify-green" />
      )}

      {isEmpty && (
        <p className="py-10 text-center text-sm text-fg/50">
          {isRequests && status !== 'resolved'
            ? 'Nobody is waiting on an artist.'
            : status === 'open'
              ? 'Nothing open.'
              : 'No reports here.'}
        </p>
      )}

      <ul className="space-y-2">
        {asked.map((request) => (
          <RequestRow
            key={request.key}
            request={request}
            isUpdating={
              updateRequests.isPending &&
              updateRequests.variables?.key === request.key
            }
            onToggle={() =>
              updateRequests.mutate(
                { key: request.key, resolved: !request.resolved },
                { onError: (err) => toast.error(err.message) },
              )
            }
          />
        ))}
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

/** A name and its votes: what to build next, in the order to build it. */
function RequestRow({
  request,
  isUpdating,
  onToggle,
}: {
  request: ArtistRequestDto;
  isUpdating: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border border-fg/10 bg-fg/[0.03] p-4 ${request.resolved ? 'opacity-60' : ''}`}
    >
      <Mic2 className="h-4 w-4 shrink-0 text-spotify-green" />
      <p className="min-w-0 flex-1 break-words text-sm font-semibold text-fg">
        {request.name}
      </p>
      <time
        className="shrink-0 text-xs text-fg/40"
        dateTime={new Date(request.lastAskedAt).toISOString()}
      >
        {new Date(request.lastAskedAt).toLocaleDateString()}
      </time>
      <span className="shrink-0 rounded-full bg-spotify-green/15 px-2.5 py-0.5 text-xs font-bold tabular-nums text-spotify-green">
        {request.count}
      </span>
      <button
        type="button"
        onClick={onToggle}
        disabled={isUpdating}
        className="shrink-0 rounded-full border border-fg/15 px-3 py-1 text-xs font-semibold text-fg/70 transition-colors hover:border-fg/30 hover:text-fg disabled:opacity-50"
      >
        {isUpdating ? '...' : request.resolved ? 'Reopen' : 'Resolve'}
      </button>
    </li>
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
  const { Icon, label, tone } = KIND_BADGE[report.kind];

  return (
    <li
      className={`rounded-xl border border-fg/10 bg-fg/[0.03] p-4 ${report.resolvedAt ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-fg/50">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${tone}`}
          >
            <Icon className="h-3 w-3" />
            {label}
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
