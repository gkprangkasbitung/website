import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { AssignRoleSelect } from "./assign-role-select";

export default async function UsersPage() {
  await requirePermission("users", "read");

  const currentUser = await getAuthenticatedUser();
  const canManage = hasPermission(currentUser, "users", "update");

  const supabase = await createClient();
  const [{ data: profiles }, { data: roles }, { data: userRoles }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, created_at").order("created_at"),
    supabase.from("roles").select("id, name").order("name"),
    supabase.from("user_roles").select("user_id, role_id"),
  ]);

  const roleByUserId = new Map((userRoles ?? []).map((ur) => [ur.user_id, ur.role_id]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pengguna</h1>
        <p className="text-muted-foreground">Kelola akun admin dan role yang dimiliki.</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(profiles ?? []).map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>{profile.full_name ?? "-"}</TableCell>
              <TableCell>{profile.email}</TableCell>
              <TableCell>
                <AssignRoleSelect
                  userId={profile.id}
                  currentRoleId={roleByUserId.get(profile.id)}
                  roles={roles ?? []}
                  disabled={!canManage}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
