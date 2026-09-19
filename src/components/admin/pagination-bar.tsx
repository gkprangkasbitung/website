"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

export function PaginationBar({
  page,
  pageSize,
  totalItems,
  entryLabel = "data",
  pageParam = "page",
  pageSizeParam = "pageSize",
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  /** Plural noun shown in "Menampilkan x-y dari z {entryLabel}". */
  entryLabel?: string;
  /** Query param names - override when a page has more than one paginated
   * table, so each gets its own independent page/pageSize state. */
  pageParam?: string;
  pageSizeParam?: string;
  /** When provided, page/pageSize changes call these instead of pushing a
   * new URL - used for a client-side-paginated table (e.g. a TanStack
   * table holding its own page state) instead of the default server/
   * URL-param mode. */
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const controlled = Boolean(onPageChange || onPageSizeChange);

  function go(nextPage: number, nextPageSize: number = pageSize) {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    if (controlled) {
      if (nextPageSize !== pageSize) onPageSizeChange?.(nextPageSize);
      onPageChange?.(clamped);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(clamped));
    params.set(pageSizeParam, String(nextPageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Tampilkan</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => v && go(1, Number(v))}
          items={Object.fromEntries(PAGE_SIZE_OPTIONS.map((n) => [String(n), String(n)]))}
        >
          <SelectTrigger className="w-18 border-none bg-transparent shadow-none dark:bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">per halaman</span>
      </div>

      <p className="text-muted-foreground tabular-nums">
        {from}–{to} dari {totalItems} {entryLabel}
      </p>

      <div className="flex items-center gap-3">
        <Button size="icon-sm" variant="ghost" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Halaman sebelumnya">
          <ChevronLeft />
        </Button>
        <span className="whitespace-nowrap text-muted-foreground tabular-nums">
          {page} / {totalPages}
        </span>
        <Button size="icon-sm" variant="ghost" onClick={() => go(page + 1)} disabled={page >= totalPages} aria-label="Halaman berikutnya">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
