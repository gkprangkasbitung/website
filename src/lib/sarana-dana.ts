import "server-only";
import type { SaranaDanaItem, SaranaDanaTransaction, SaranaDanaWeeklyReport } from "@/types/warta";

/** Builds a per-item financial report for [rangeFrom, rangeTo] (inclusive).
 * `transactionsUpToRangeTo` must include every transaction with
 * `tanggal <= rangeTo` for the given items - saldoAwal is the running
 * balance right before rangeFrom, saldoAkhir is that plus this range's
 * pemasukan/pengeluaran. */
export function buildSaranaDanaWeeklyReport(
  items: SaranaDanaItem[],
  transactionsUpToRangeTo: SaranaDanaTransaction[],
  rangeFrom: string,
  rangeTo: string,
): SaranaDanaWeeklyReport[] {
  const buckets = new Map<string, { before: number; masuk: number; keluar: number }>();
  for (const item of items) {
    buckets.set(item.id, { before: 0, masuk: 0, keluar: 0 });
  }

  for (const t of transactionsUpToRangeTo) {
    const bucket = buckets.get(t.item_id);
    if (!bucket || t.tanggal > rangeTo) continue;
    if (t.tanggal < rangeFrom) {
      bucket.before += t.tipe === "masuk" ? t.jumlah : -t.jumlah;
    } else if (t.tipe === "masuk") {
      bucket.masuk += t.jumlah;
    } else {
      bucket.keluar += t.jumlah;
    }
  }

  return items.map((item) => {
    const bucket = buckets.get(item.id)!;
    const saldoAwal = item.saldo_awal + bucket.before;
    return {
      id: item.id,
      key: item.key,
      name: item.name,
      keterangan: item.keterangan,
      saldoAwal,
      pemasukan: bucket.masuk,
      pengeluaran: bucket.keluar,
      saldoAkhir: saldoAwal + bucket.masuk - bucket.keluar,
    };
  });
}
