"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Tabs bound to ?danaTab=<item key>, one per Sarana & Dana item - switching
 * tabs navigates (server re-fetches that item's transactions) and resets
 * the ledger's own ?page= back to 1. */
export function SaranaDanaTabs({
  items,
  activeKey,
  children,
}: {
  items: { key: string; name: string }[];
  activeKey: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onValueChange(value: unknown) {
    if (typeof value !== "string" || value === activeKey) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("danaTab", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeKey} onValueChange={onValueChange}>
      <TabsList variant="line" className="h-auto flex-wrap">
        {items.map((item) => (
          <TabsTrigger key={item.key} value={item.key}>
            {item.name}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={activeKey} className="pt-4">
        {children}
      </TabsContent>
    </Tabs>
  );
}
