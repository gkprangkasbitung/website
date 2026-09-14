import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/rbac/dal";

export default async function AdminDashboardPage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {user.profile?.full_name ?? user.email}.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Role Anda</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {user.roles.map((r) => r.name).join(", ") || "Tidak ada"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Jumlah Permission</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{user.permissions.length}</CardContent>
        </Card>
      </div>
    </div>
  );
}
