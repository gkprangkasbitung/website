import { formatRupiah } from "@/lib/format";
import type { SaranaDanaWeeklyReport } from "@/types/warta";

/** Saldo Awal / Pemasukan / Pengeluaran / Saldo Akhir stat strip for one
 * item's weekly report - see buildSaranaDanaWeeklyReport. */
export function SaranaDanaWeeklyStats({ report }: { report: SaranaDanaWeeklyReport }) {
  const stats = [
    { label: "Saldo Awal", value: report.saldoAwal },
    { label: "Pemasukan", value: report.pemasukan },
    { label: "Pengeluaran", value: report.pengeluaran },
    { label: "Saldo Akhir", value: report.saldoAkhir },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="text-lg font-semibold">{formatRupiah(s.value)}</p>
        </div>
      ))}
    </div>
  );
}
