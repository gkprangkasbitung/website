"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "cn";
import { TableHead } from "@/components/ui/table";

/** A TableHead that toggles ?sort=<sortKey>&dir=asc|desc on click, cycling
 * asc -> desc -> unsorted. Sorting is done server-side (see the page's
 * Supabase query), this just reflects/drives that state via the URL. */
export function SortableTableHead({
  sortKey,
  children,
  className,
  align = "left",
}: {
  sortKey: string;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort");
  const currentDir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const isActive = currentSort === sortKey;

  function onClick() {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive && currentDir === "asc") {
      params.set("sort", sortKey);
      params.set("dir", "desc");
    } else if (isActive && currentDir === "desc") {
      params.delete("sort");
      params.delete("dir");
    } else {
      params.set("sort", sortKey);
      params.set("dir", "asc");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:text-foreground", align === "right" && "text-right", className)}
      onClick={onClick}
      aria-sort={isActive ? (currentDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "w-full justify-end")}>
        {children}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-30" />
        )}
      </span>
    </TableHead>
  );
}
