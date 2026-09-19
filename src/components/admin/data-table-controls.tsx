"use client";

import { useState } from "react";
import type { RowData } from "@tanstack/react-table";
import type { LegacyColumn } from "@tanstack/react-table/legacy";
import { ChevronDown, ChevronUp, ListFilter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "cn";

/** Shared header/toolbar pieces for a client-side-sorted/filtered TanStack
 * table (see peribadahan-table.tsx and peribadahan-editor.tsx) - kept
 * generic over the row type so both can reuse the exact same components. */

/** A column header that's a button toggling sort asc -> desc -> none. The
 * chevron only shows up once this column is the active sort - an unsorted
 * column stays plain text, no faded placeholder icon. */
export function SortHeader<TData extends RowData>({
  column,
  label,
  align,
}: {
  column: LegacyColumn<TData, unknown>;
  label: string;
  align?: "right";
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "h-auto gap-1 p-0 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:bg-transparent hover:text-foreground",
        align === "right" && "flex-row-reverse",
      )}
    >
      {label}
      {sorted === "asc" && <ChevronUp className="size-3.5" />}
      {sorted === "desc" && <ChevronDown className="size-3.5" />}
    </Button>
  );
}

/** A plain (non-sortable) label plus a small search icon that opens a
 * popover with a single input filtering just this column. */
export function SearchHeader<TData extends RowData>({ column, label }: { column: LegacyColumn<TData, unknown>; label: string }) {
  const [open, setOpen] = useState(false);
  const value = (column.getFilterValue() as string | undefined) ?? "";

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn("shrink-0 text-muted-foreground hover:text-foreground", value && "text-foreground")}
            />
          }
        >
          <Search className="size-3" />
          <span className="sr-only">Cari {label}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2">
          <Input
            autoFocus
            value={value}
            onChange={(e) => column.setFilterValue(e.target.value || undefined)}
            placeholder={`Cari ${label.toLowerCase()}...`}
            className="h-8"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Toolbar filter: a multi-select checklist of every distinct value present
 * in this column (via TanStack's faceted unique values - never hardcoded),
 * each with a live count. */
export function FacetedFilter<TData extends RowData>({ column, title }: { column: LegacyColumn<TData, unknown>; title: string }) {
  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? []);
  const options = Array.from(column.getFacetedUniqueValues().entries())
    .filter(([value]) => value != null && value !== "")
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  function toggle(value: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    column.setFilterValue(next.size > 0 ? Array.from(next) : undefined);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" />}
      >
        <ListFilter className="size-3.5" />
        {title}
        {selected.size > 0 && (
          <Badge variant="secondary" className="px-1.5 tabular-nums">
            {selected.size}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {options.map(([value, count]) => (
          <DropdownMenuCheckboxItem
            key={String(value)}
            checked={selected.has(String(value))}
            onCheckedChange={(checked) => toggle(String(value), checked)}
          >
            <span className="flex-1">{String(value)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
