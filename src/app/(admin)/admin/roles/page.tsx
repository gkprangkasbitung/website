import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser, hasPermission, requirePermission } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { CreateRoleDialog, DeleteRoleButton } from "./role-actions";

export default async function RolesPage() {
  await requirePermission("roles", "read");

  const currentUser = await getAuthenticatedUser();
  const canCreate = hasPermission(currentUser, "roles", "create");
  const canDelete = hasPermission(currentUser, "roles", "delete");

  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("roles")
    .select("id, name, description, role_permissions(permissions(id, resource, action))")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Setiap role adalah kumpulan permission berbentuk resource:action.
          </p>
        </div>
        {canCreate && <CreateRoleDialog />}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(roles ?? []).map((role) => (
          <Card key={role.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{role.name}</CardTitle>
              {canDelete && <DeleteRoleButton roleId={role.id} />}
            </CardHeader>
            <CardContent>
              {role.description && (
                <p className="mb-3 text-sm text-muted-foreground">{role.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {role.role_permissions
                  .map((rp) => rp.permissions)
                  .filter((p): p is NonNullable<typeof p> => Boolean(p))
                  .map((p) => (
                    <Badge key={p.id} variant="secondary">
                      {p.resource}:{p.action}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
