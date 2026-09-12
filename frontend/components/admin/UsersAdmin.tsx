'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Search,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useAdminUpdateUserRole } from '@/hooks/admin/useAdminUpdateUserRole';
import { useMe } from '@/hooks/auth/useMe';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Pagination } from '@/components/ui/Pagination';
import { DEBOUNCE_MS } from '@/consts/consts';
import type { AdminUserDto } from '@/sdk';
import {
  AdminControllerListUsersSortByEnum as SortBy,
  AdminControllerListUsersSortOrderEnum as SortOrder,
} from '@/sdk/apis/ApiApi';

const COLUMNS: {
  label: string;
  align: string;
  width: string;
  /** Absent where ordering says nothing, as it does for a role flag. */
  sort?: { key: SortBy; initialOrder: SortOrder };
}[] = [
  {
    label: 'User',
    align: 'text-left',
    width: 'w-auto',
    sort: { key: SortBy.DisplayName, initialOrder: SortOrder.Asc },
  },
  {
    label: 'Joined',
    align: 'text-right',
    width: 'w-32',
    sort: { key: SortBy.CreatedAt, initialOrder: SortOrder.Desc },
  },
  { label: 'Trusted', align: 'text-center', width: 'w-24' },
  { label: 'Admin', align: 'text-center', width: 'w-24' },
];

const PAGE_SIZES = [10, 25, 50];

export function UsersAdmin() {
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.CreatedAt);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Desc);
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [adminsOnly, setAdminsOnly] = useState(false);

  const search = useDebouncedValue(searchInput.trim(), DEBOUNCE_MS);

  // Otherwise a narrower list leaves the reader on a page that no longer
  // exists, looking at nothing.
  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder, limit, trustedOnly, adminsOnly]);

  const { data, isLoading, error } = useAdminUsers({
    page,
    limit,
    sortBy,
    sortOrder,
    search: search || undefined,
    isTrusted: trustedOnly || undefined,
    isAdmin: adminsOnly || undefined,
  });

  const { data: me } = useMe();
  const updateRole = useAdminUpdateUserRole();

  const handleSort = (sort: NonNullable<(typeof COLUMNS)[number]['sort']>) => {
    if (sortBy === sort.key) {
      setSortOrder(
        sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc,
      );
      return;
    }
    setSortBy(sort.key);
    setSortOrder(sort.initialOrder);
  };

  const handleToggle = async (
    user: AdminUserDto,
    field: 'isTrusted' | 'isAdmin',
  ) => {
    try {
      await updateRole.mutateAsync({
        id: user.id,
        dto: { [field]: !user[field] },
      });
      toast.success(
        `${user.displayName} ${!user[field] ? 'granted' : 'revoked'} ${field === 'isAdmin' ? 'admin' : 'trusted'} role`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const isSelf = (user: AdminUserDto) => me?.userId === user.id;
  const isUpdating = (user: AdminUserDto) =>
    updateRole.isPending && updateRole.variables?.id === user.id;

  const users = data?.items ?? [];
  const meta = data?.meta;
  const isFiltered = Boolean(search) || trustedOnly || adminsOnly;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-fg">Users</h2>
        {meta && (
          <span className="text-xs text-fg/40">({meta.totalItems})</span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg/30" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name"
            aria-label="Search users by display name"
            className="w-full rounded-full border border-fg/10 bg-fg/5 py-2 pl-9 pr-8 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/40 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-fg/30 hover:text-fg/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-fg/10 bg-fg/5 p-1">
          <FilterChip
            isActive={trustedOnly}
            onClick={() => setTrustedOnly((on) => !on)}
            activeClasses="bg-green-500/15 text-green-400"
          >
            Trusted
          </FilterChip>
          <FilterChip
            isActive={adminsOnly}
            onClick={() => setAdminsOnly((on) => !on)}
            activeClasses="bg-amber-500/15 text-amber-400"
          >
            Admins
          </FilterChip>
        </div>

        <div
          role="group"
          aria-label="Users per page"
          className="flex items-center gap-1 rounded-full border border-fg/10 bg-fg/5 p-1"
        >
          <span className="pl-2.5 pr-0.5 text-[10px] font-bold uppercase tracking-wider text-fg/25">
            Per page
          </span>
          {PAGE_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setLimit(size)}
              aria-pressed={limit === size}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-colors ${
                limit === size
                  ? 'bg-fg/[0.14] text-fg shadow-[0_1px_3px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-fg/40 hover:text-fg/70'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3">
          Failed to load users.
        </div>
      )}

      {!error && (
        <div className="overflow-hidden rounded-xl border border-fg/10">
          {/* Its own scroller, so a narrow screen scrolls the table rather
              than the page sideways. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-fg/10 bg-fg/[0.03]">
                  {COLUMNS.map((column) => {
                    const columnSort = column.sort;
                    const isSorted = columnSort?.key === sortBy;
                    return (
                      <th
                        key={column.label}
                        scope="col"
                        aria-sort={
                          !columnSort
                            ? undefined
                            : isSorted
                              ? sortOrder === SortOrder.Asc
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                        }
                        className={`px-3 py-2 ${column.align} ${column.width}`}
                      >
                        {columnSort ? (
                          <button
                            type="button"
                            onClick={() => handleSort(columnSort)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              isSorted
                                ? 'bg-fg/[0.14] text-fg/80 shadow-[0_1px_3px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]'
                                : 'text-fg/30 hover:text-fg/60'
                            }`}
                          >
                            {column.label}
                            {/* The arrow keeps its space either way, or the
                                columns jump when the sort moves. */}
                            <span className="flex h-3 w-3 items-center justify-center">
                              {isSorted &&
                                (sortOrder === SortOrder.Asc ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                ))}
                            </span>
                          </button>
                        ) : (
                          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-fg/30">
                            {column.label}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="py-10">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-spotify-green" />
                    </td>
                  </tr>
                )}

                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={COLUMNS.length}
                      className="py-10 text-center text-fg/50"
                    >
                      {isFiltered
                        ? 'No users match those filters.'
                        : 'No users found.'}
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-fg/[0.06] last:border-0 hover:bg-fg/[0.03]"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="rounded-full shrink-0"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fg/10 text-xs font-medium text-fg/60">
                              {user.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg">
                              {user.displayName}
                              {isSelf(user) && (
                                <span className="ml-1.5 text-xs text-fg/40">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-fg/35">
                              {user.spotifyUserId ?? 'No Spotify account'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-right text-xs tabular-nums text-fg/40">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <RoleToggle
                          on={user.isTrusted}
                          busy={isUpdating(user)}
                          label={`${user.isTrusted ? 'Revoke' : 'Grant'} trusted for ${user.displayName}`}
                          onClick={() => handleToggle(user, 'isTrusted')}
                          tone="green"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <RoleToggle
                          on={user.isAdmin}
                          busy={isUpdating(user)}
                          disabled={isSelf(user)}
                          label={
                            isSelf(user)
                              ? 'You cannot change your own admin status'
                              : `${user.isAdmin ? 'Revoke' : 'Grant'} admin for ${user.displayName}`
                          }
                          onClick={() => handleToggle(user, 'isAdmin')}
                          tone="amber"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

function FilterChip({
  isActive,
  onClick,
  activeClasses,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  activeClasses: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        isActive
          ? `${activeClasses} shadow-[0_1px_3px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]`
          : 'text-fg/40 hover:text-fg/70'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The state is the control. A row holding the role reads as filled and one
 * without it as a dash, so the column can be scanned rather than read.
 */
function RoleToggle({
  on,
  busy,
  disabled,
  label,
  onClick,
  tone,
}: {
  on: boolean;
  busy: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone: 'green' | 'amber';
}) {
  const onClasses =
    tone === 'green'
      ? 'bg-green-500/15 text-green-400 ring-green-500/30'
      : 'bg-amber-500/15 text-amber-400 ring-amber-500/30';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      title={label}
      aria-label={label}
      aria-pressed={on}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        on
          ? `ring-1 ${onClasses}`
          : 'text-fg/20 hover:bg-fg/5 hover:text-fg/50 hover:ring-1 hover:ring-fg/15'
      }`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : on ? (
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      ) : (
        <span className="h-px w-2.5 rounded-full bg-current" />
      )}
    </button>
  );
}
