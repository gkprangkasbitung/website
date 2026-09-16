"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const HUBUNGAN_KELUARGA_OPTIONS = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Orang Tua",
  "Kerabat Lain",
] as const;

/** Fixed vocabulary for `hubungan_keluarga`, shared by the Data Jemaat form
 * and the Keluarga detail page so family relations stay consistent instead
 * of drifting into free-text variants of the same thing. */
export function HubunganKeluargaSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const items = Object.fromEntries(HUBUNGAN_KELUARGA_OPTIONS.map((o) => [o, o]));

  return (
    <Select value={value ?? ""} onValueChange={(v) => v && onChange(v)} items={items} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih hubungan" />
      </SelectTrigger>
      <SelectContent>
        {HUBUNGAN_KELUARGA_OPTIONS.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
