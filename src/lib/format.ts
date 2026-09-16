export function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Digits-only string (as typed/stored) -> "1.000.000" for display in an input. */
export function formatThousands(digits: string) {
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

/** Strips everything but digits, so typing "-" or "." never reaches the stored value. */
export function parseThousands(value: string) {
  return value.replace(/\D/g, "");
}
