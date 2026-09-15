export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Clamps a raw ?pageSize= value to one of PAGE_SIZE_OPTIONS. */
export function parsePageSize(raw: string | undefined): number {
  const n = Number(raw);
  return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number]) ? n : DEFAULT_PAGE_SIZE;
}
