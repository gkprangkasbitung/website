import { PaginationBar } from "@/components/admin/pagination-bar";
import { SortableTableHead } from "@/components/admin/sortable-table-head";
import { TableSearchInput } from "@/components/admin/table-search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parsePageSize } from "@/lib/pagination";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { parseSortDir, parseSortKey } from "@/lib/sort";
import { createClient } from "@/lib/supabase/server";
import { DeleteUserButton } from "./delete-user-button";
import { EditUserDialog } from "./edit-user-dialog";
import { InviteUserDialog } from "./invite-user-dialog";

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
      <div className="flex items-center justify-between">
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
            {canDelete && <TableHead className="w-1" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(profiles ?? []).map((profile) => {
            const roleId = roleByUserId.get(profile.id);
            return (
              <TableRow key={profile.id}>
                <TableCell>{profile.full_name ?? "-"}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{roleId ? (roleNameById.get(roleId) ?? "-") : "-"}</TableCell>
                <TableCell>
                  {profile.jemaat_id ? (jemaatNameById.get(profile.jemaat_id) ?? "-") : "-"}
                </TableCell>
                <TableCell>
                  <EditUserDialog
                    userId={profile.id}
                    userLabel={profile.full_name ?? profile.email ?? "Pengguna"}
                    currentRoleId={roleId}
                    roles={roles ?? []}
                    currentJemaatId={profile.jemaat_id}
                    jemaatList={jemaatList ?? []}
                    disabled={!canManage}
                  />
                </TableCell>
                {canDelete && (
                  <TableCell>
                    {profile.id !== currentUser.id && (
                      <DeleteUserButton userId={profile.id} email={profile.email} />
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} totalItems={count ?? 0} entryLabel="pengguna" />
    </div>
  );
}
