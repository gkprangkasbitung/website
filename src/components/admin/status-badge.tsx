import { Badge } from "@/components/ui/badge";
import { STATUS_KEANGGOTAAN_LABEL } from "@/types/warta";

/** Status tag colors follow the admin design mockup: simpatisan (not yet a
 * confirmed member) gets an accent outline, baptis anak gets a tinted fill,
 * and the two full-membership statuses share a neutral pill. */
const STATUS_TAG_CLASS: Record<string, string> = {
  anggota_penuh: "border-transparent bg-secondary text-secondary-foreground",
  sidi: "border-transparent bg-secondary text-secondary-foreground",
  baptis_anak: "border-transparent bg-accent text-accent-foreground",
  simpatisan: "bg-transparent border-primary text-primary",
};

/** Renders a jemaat's `status_keanggotaan` as the shared colored pill, used
 * on both the Data Jemaat table and the Keluarga detail member list. */
export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;

  const label = STATUS_KEANGGOTAAN_LABEL[status as keyof typeof STATUS_KEANGGOTAAN_LABEL] ?? status;
  const className =
    STATUS_TAG_CLASS[status] ?? "border-transparent bg-secondary text-secondary-foreground";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
