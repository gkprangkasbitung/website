"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

/** A search box bound to ?q=, debounced so it doesn't navigate on every
 * keystroke. Matching is "contains" (case-insensitive) - done server-side
 * via ilike on whichever columns the page searches. */
export function TableSearchInput({
  placeholder = "Cari...",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (value === current) return;

      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={className ?? "w-64"}
    />
  );
}
