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
import type { JemaatWithLabels } from "@/types/warta";

/** Searchable jemaat picker: typing matches against the person's name OR
 * any of their labels (e.g. typing "Liturgos" surfaces everyone tagged
 * with that label), so a long congregation list stays easy to narrow down. */
export function JemaatSelect({
  value,
  onChange,
  jemaatList,
  placeholder,
  disabled,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  jemaatList: JemaatWithLabels[];
  placeholder: string;
  disabled?: boolean;
}) {
  const jemaatById = new Map(jemaatList.map((j) => [j.id, j]));

  return (
    <Combobox
      items={jemaatList}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={(id: string | null) => (id ? (jemaatById.get(id)?.nama ?? "") : "")}
      filter={(item: JemaatWithLabels, query: string) => {
        const q = query.toLowerCase();
        return (
          item.nama.toLowerCase().includes(q) ||
          item.labels.some((l) => l.nama.toLowerCase().includes(q))
        );
      }}
      disabled={disabled}
    >
      <ComboboxAnchor>
        <ComboboxInput placeholder={placeholder} />
      </ComboboxAnchor>
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxEmpty>Tidak ditemukan</ComboboxEmpty>
            <ComboboxList>
              {(item: JemaatWithLabels) => (
                <ComboboxItem key={item.id} value={item.id}>
                  <span>{item.nama}</span>
                  {item.labels.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.labels.map((l) => l.nama).join(", ")}
                    </span>
                  )}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </Combobox>
  );
}
