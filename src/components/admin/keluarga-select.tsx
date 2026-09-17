"use client";

import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
} from "@/components/ui/combobox";
import type { Keluarga } from "@/types/warta";

/** Searchable keluarga picker. The form only stores the family's *name*
 * (see `keluarga_nama` in the jemaat PATCH/POST payload, resolved
 * server-side via `findOrCreateKeluarga`), so this maps the combobox's
 * id-based selection back to a name on the way out - and, on the way in,
 * matches the current name against the list to highlight the right item. */
export function KeluargaSelect({
  value,
  onChange,
  allKeluarga,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  allKeluarga: Keluarga[];
  disabled?: boolean;
}) {
  const keluargaById = new Map(allKeluarga.map((k) => [k.id, k]));
  const selectedId =
    allKeluarga.find((k) => k.nama.toLowerCase() === value.trim().toLowerCase())?.id ?? null;

  return (
    <Combobox
      items={allKeluarga}
      value={selectedId}
      onValueChange={(id: string | null) => onChange(id ? (keluargaById.get(id)?.nama ?? "") : "")}
      itemToStringLabel={(id: string | null) => (id ? (keluargaById.get(id)?.nama ?? "") : "")}
      filter={(item: Keluarga, query: string) => item.nama.toLowerCase().includes(query.toLowerCase())}
      disabled={disabled}
    >
      <ComboboxAnchor>
        <ComboboxInput placeholder="Cari keluarga..." />
      </ComboboxAnchor>
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxEmpty>Tidak ditemukan - buat dulu di halaman Keluarga</ComboboxEmpty>
            <ComboboxList>
              {(item: Keluarga) => (
                <ComboboxItem key={item.id} value={item.id}>
                  {item.nama}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </Combobox>
  );
}
