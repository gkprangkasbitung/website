import { PaginationBar } from "@/components/admin/pagination-bar";
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
import { createClient } from "@/lib/supabase/server";
import { DeleteUserButton } from "./delete-user-button";
import { EditUserDialog } from "./edit-user-dialog";
import { InviteUserDialog } from "./invite-user-dialog";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  await requirePermission("users", "read");

  const currentUser = await getAuthenticatedUser();
  const canManage = hasPermission(currentUser, "users", "update");
  const canInvite = hasPermission(currentUser, "users", "create");
  const canDelete = hasPermission(currentUser, "users", "delete");

  const { page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const pageSize = parsePageSize(pageSizeParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const [{ data: profiles, count }, { data: roles }, { data: userRoles }, { data: jemaatList }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, jemaat_id, created_at", { count: "exact" })
        .order("created_at")
        .range(from, to),
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
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
