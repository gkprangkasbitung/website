import { TableCell, TableRow } from "@/components/ui/table";

/** A centered, roomy empty-state row - spans the full table width instead of
 * the tiny left-aligned muted text a bare TableCell would give. `action`
 * is a single primary action (e.g. the same "Tambah X" dialog trigger
 * already shown above the table) rendered below the message. */
export function TableEmptyState({
  colSpan,
  action,
  children,
}: {
  colSpan: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">{children}</p>
          {action}
        </div>
      </TableCell>
    </TableRow>
  );
}
