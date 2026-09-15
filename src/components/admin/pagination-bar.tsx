"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  /** Plural noun shown in "Menampilkan x-y dari z {entryLabel}". */
  entryLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  function go(nextPage: number, nextPageSize: number = pageSize) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(Math.min(Math.max(1, nextPage), totalPages)));
    params.set("pageSize", String(nextPageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Tampilkan</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => v && go(1, Number(v))}
          items={Object.fromEntries(PAGE_SIZE_OPTIONS.map((n) => [String(n), String(n)]))}
        >
          <SelectTrigger className="w-18">
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
        <span className="text-muted-foreground">data per halaman</span>
      </div>

      <p className="text-muted-foreground">
        Menampilkan {from}-{to} dari {totalItems} {entryLabel}
      </p>

      <div className="flex items-center gap-1">
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => go(1)}
          disabled={page <= 1}
          aria-label="Halaman pertama"
        >
          <ChevronsLeft />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 whitespace-nowrap text-muted-foreground">
          Halaman {page} dari {totalPages}
        </span>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => go(totalPages)}
          disabled={page >= totalPages}
          aria-label="Halaman terakhir"
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
