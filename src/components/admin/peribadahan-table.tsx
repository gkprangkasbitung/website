"use client";

import { useMemo, useState } from "react";
import { flexRender, type ColumnFiltersState, type SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { FacetedFilter, SearchHeader, SortHeader } from "@/components/admin/data-table-controls";
import { TableEmptyState } from "@/components/admin/table-empty-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "cn";
import { formatTanggalPendek } from "@/lib/date";
import { PERIBADAHAN_PLACEHOLDER_ROWS, type PeribadahanPlaceholderRow } from "@/components/admin/peribadahan-table-data";

/** Columns whose values read as quantities, not labels - right-aligned with
 * tabular figures so they line up for scanning, per CLAUDE.md. */
const ALIGN_RIGHT_COLUMNS = new Set(["tanggal", "jam", "jumlahHadir"]);

export function PeribadahanTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<LegacyColumnDef<PeribadahanPlaceholderRow>[]>(
    () => [
      {
        accessorKey: "tanggal",
        header: ({ column }) => <SortHeader column={column} label="Tanggal" align="right" />,
        cell: ({ getValue }) => formatTanggalPendek(getValue() as string),
      },
      {
        accessorKey: "jam",
        header: ({ column }) => <SortHeader column={column} label="Waktu" align="right" />,
      },
      {
        accessorKey: "jenis",
        header: ({ column }) => <SearchHeader column={column} label="Jenis" />,
        filterFn: "includesString",
      },
      {
        accessorKey: "tempat",
        header: ({ column }) => <SortHeader column={column} label="Tempat" />,
        filterFn: "arrHas",
      },
      {
        accessorKey: "wilayah",
        header: ({ column }) => <SortHeader column={column} label="Wilayah" />,
        filterFn: "arrHas",
      },
      {
        accessorKey: "pelayanFirman",
        header: ({ column }) => <SearchHeader column={column} label="Pelayan Firman" />,
        filterFn: "includesString",
      },
      {
        accessorKey: "jumlahHadir",
        header: ({ column }) => <SortHeader column={column} label="Jumlah Hadir" align="right" />,
      },
    ],
    [],
  );

  const table = useLegacyTable({
    data: PERIBADAHAN_PLACEHOLDER_ROWS,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
  });

  const hasFilters = columnFilters.length > 0;
  const rows = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const from = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalFiltered);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FacetedFilter column={table.getColumn("wilayah")!} title="Wilayah" />
        <FacetedFilter column={table.getColumn("tempat")!} title="Tempat" />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => table.resetColumnFilters()}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {table.getFlatHeaders().map((header) => (
              <TableHead key={header.id} className={cn(ALIGN_RIGHT_COLUMNS.has(header.column.id) && "text-right")}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(ALIGN_RIGHT_COLUMNS.has(cell.column.id) && "text-right tabular-nums")}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableEmptyState
              colSpan={columns.length}
              action={
                hasFilters && (
                  <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()}>
                    Reset filter
                  </Button>
                )
              }
            >
              Tidak ada jadwal yang cocok dengan filter ini.
            </TableEmptyState>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-4 py-2 text-sm">
        <p className="text-muted-foreground tabular-nums">
          {from}–{to} dari {totalFiltered}
        </p>
        <div className="flex items-center gap-3">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft />
          </Button>
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {pageIndex + 1} / {Math.max(1, table.getPageCount())}
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
