"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** A single-select dropdown bound to `?<param>=`, used to filter a table by
 * an exact-match column server-side (e.g. wilayah, status). */
export function TableSelectFilter({
  param,
  placeholder,
  options,
  className,
}: {
  param: string;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const ALL = "__all__";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(param) || ALL;

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) {
      params.set(param, value);
    } else {
      params.delete(param);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  const items = { [ALL]: placeholder, ...Object.fromEntries(options.map((o) => [o.value, o.label])) };

  return (
    <Select value={current} onValueChange={(v) => v && onChange(v)} items={items}>
      <SelectTrigger className={className ?? "w-auto border-none bg-transparent shadow-none dark:bg-transparent"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
