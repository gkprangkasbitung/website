"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Two date inputs bound to ?from=&to=, used to filter a date column with
 * a BETWEEN-style range server-side. */
export function TableDateRangeFilter({ label = "Tanggal" }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label} Dari</Label>
        <Input
          type="date"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => update("from", e.target.value)}
          className="border-none bg-transparent shadow-none dark:bg-transparent"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label} Sampai</Label>
        <Input
          type="date"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => update("to", e.target.value)}
          className="border-none bg-transparent shadow-none dark:bg-transparent"
        />
      </div>
    </div>
  );
}
