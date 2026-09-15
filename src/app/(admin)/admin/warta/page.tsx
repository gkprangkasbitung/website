import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default async function WartaListPage() {
  await requirePermission("warta", "read");
  const currentUser = await getAuthenticatedUser();
  const canCreate = hasPermission(currentUser, "warta", "create");

  const supabase = await createClient();
  const { data: wartaList } = await supabase
    .from("warta")
    .select("id, slug, status, tanggal_kebaktian, judul_kebaktian")
    .order("tanggal_kebaktian", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Warta</h1>
          <p className="text-muted-foreground">Buletin ibadah mingguan.</p>
        </div>
        {canCreate && (
          <Button render={<Link href="/admin/warta/new" />}>Buat Warta Baru</Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Judul</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(wartaList ?? []).map((warta) => (
            <TableRow key={warta.id}>
              <TableCell>{warta.tanggal_kebaktian}</TableCell>
              <TableCell>{warta.judul_kebaktian}</TableCell>
              <TableCell>
                <Badge variant={warta.status === "published" ? "default" : "secondary"}>
                  {warta.status === "published" ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/admin/warta/${warta.id}`} />}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
