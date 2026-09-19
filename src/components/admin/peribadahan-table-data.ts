/**
 * TODO: this is placeholder data for the PeribadahanTable preview
 * (`/admin/peribadahan-lengkap`) - swap it for a real Supabase query once
 * this table is wired up for real. The shape mirrors
 * `PeribadahanItemWithRelations` in `src/types/warta.ts` (the same fields
 * the real, server-driven table at `src/components/admin/peribadahan-editor.tsx`
 * already queries via `src/app/(admin)/admin/peribadahan/page.tsx`).
 *
 * Every value below is synthetic ("Wilayah 1", "Pelayan Firman 2", ...) -
 * none of it is a real jemaat, wilayah, or tempat name, per CLAUDE.md's
 * rule against inventing member/congregation data.
 */
export interface PeribadahanPlaceholderRow {
  id: string;
  tanggal: string;
  jam: string;
  jenis: string;
  tempat: string;
  wilayah: string;
  pelayanFirman: string;
  jumlahHadir: number;
}

const JENIS = ["Ibadah Minggu", "Kebaktian Rumah Tangga", "Pemahaman Alkitab", "Doa Pagi"];
const TEMPAT = ["Gedung Gereja", "Ruang Konsistori", "Tempat Contoh A", "Tempat Contoh B"];
const WILAYAH = ["Wilayah 1", "Wilayah 2", "Wilayah 3", "Wilayah 4", "Wilayah 5"];
const PELAYAN = ["Pelayan Firman 1", "Pelayan Firman 2", "Pelayan Firman 3", "Pelayan Firman 4"];

function pick<T>(list: T[], i: number): T {
  return list[i % list.length];
}

export const PERIBADAHAN_PLACEHOLDER_ROWS: PeribadahanPlaceholderRow[] = Array.from(
  { length: 32 },
  (_, i) => {
    const day = 1 + (i % 28);
    const month = 1 + Math.floor(i / 28);
    return {
      id: `placeholder-${i + 1}`,
      tanggal: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      jam: i % 3 === 0 ? "07:00" : i % 3 === 1 ? "10:00" : "18:00",
      jenis: pick(JENIS, i),
      tempat: pick(TEMPAT, i + 1),
      wilayah: pick(WILAYAH, i + 2),
      pelayanFirman: pick(PELAYAN, i),
      jumlahHadir: 40 + ((i * 17) % 160),
    };
  },
);
