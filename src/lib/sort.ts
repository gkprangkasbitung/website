export type SortDir = "asc" | "desc";

/** Validates a raw ?sort= value against the columns a page allows sorting
 * by, falling back to null (meaning: use the page's default order) when
 * it's missing or not one of them. */
export function parseSortKey<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
): T | null {
  return (allowed as readonly string[]).includes(raw ?? "") ? (raw as T) : null;
}

export function parseSortDir(raw: string | undefined): SortDir {
  return raw === "desc" ? "desc" : "asc";
}
