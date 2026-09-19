import { PaginationBar } from "@/components/admin/pagination-bar";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { TableEmptyState } from "@/components/admin/table-empty-state";
import { TableSearchInput } from "@/components/admin/table-search-input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { parseSortDir, parseSortKey } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";
import { InviteUserDialog } from "./invite-user-dialog";
import { UserRow } from "./user-row";

const SORT_COLUMNS = ["full_name", "email"] as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; sort?: string; dir?: string; q?: string }>;
}) {
  await requirePermission("users", "read");

  const currentUser = await getAuthenticatedUser();
  const canManage = hasPermission(currentUser, "users", "update");
  const canInvite = hasPermission(currentUser, "users", "create");
  const canDelete = hasPermission(currentUser, "users", "delete");

  const { page: pageParam, pageSize: pageSizeParam, sort, dir, q } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const sortKey = parseSortKey(sort, SORT_COLUMNS) ?? "created_at";
  const sortDir = parseSortDir(dir);

  const supabase = await createClient();
  let profilesQuery = supabase
    .from("profiles")
    .select("id, email, full_name, jemaat_id, created_at", { count: "exact" });

  if (q) profilesQuery = profilesQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const [{ data: profiles, count }, { data: roles }, { data: userRoles }, { data: jemaatList }] =
    await Promise.all([
      profilesQuery.order(sortKey, { ascending: sortDir === "asc" }).range(rangeFrom, rangeTo),
      supabase.from("roles").select("id, name").order("name"),
      supabase.from("user_roles").select("user_id, role_id"),
      supabase.from("jemaat").select("id, nama").order("nama"),
    ]);

  const roleByUserId = new Map((userRoles ?? []).map((ur) => [ur.user_id, ur.role_id]));
  const roleNameById = new Map((roles ?? []).map((r) => [r.id, r.name]));
  const jemaatNameById = new Map((jemaatList ?? []).map((j) => [j.id, j.nama]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pengguna</h1>
          <p className="text-muted-foreground">Kelola akun admin dan role yang dimiliki.</p>
        </div>
        {canInvite && <InviteUserDialog roles={roles ?? []} jemaatList={jemaatList ?? []} />}
      </div>
      <TableSearchInput placeholder="Cari nama/email..." />
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="full_name">Nama</SortableTableHead>
            <SortableTableHead sortKey="email">Email</SortableTableHead>
            <TableHead>Role</TableHead>
            <TableHead>Jemaat</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(profiles ?? []).map((profile) => {
            const roleId = roleByUserId.get(profile.id);
            return (
              <UserRow
                key={profile.id}
                profileId={profile.id}
                fullName={profile.full_name}
                email={profile.email}
                roleName={roleId ? (roleNameById.get(roleId) ?? null) : null}
                jemaatName={profile.jemaat_id ? (jemaatNameById.get(profile.jemaat_id) ?? null) : null}
                currentRoleId={roleId}
                roles={roles ?? []}
                currentJemaatId={profile.jemaat_id}
                jemaatList={jemaatList ?? []}
                canManage={canManage}
                canDelete={canDelete}
                isSelf={profile.id === currentUser.id}
              />
            );
          })}
          {(profiles ?? []).length === 0 && (
            <TableEmptyState
              colSpan={5}
              action={canInvite && <InviteUserDialog roles={roles ?? []} jemaatList={jemaatList ?? []} />}
            >
              Belum ada pengguna.
            </TableEmptyState>
          )}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="pengguna" />
    </div>
  );
}
