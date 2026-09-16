export const ACTIVITY_MODULES = [
  "auth",
  "akun",
  "warta",
  "peribadahan",
  "litbang",
  "sarana_dana",
  "tempat",
  "wilayah",
  "jemaat",
  "label_jemaat",
  "users",
  "roles",
] as const;

export type ActivityModule = (typeof ACTIVITY_MODULES)[number];

export const ACTIVITY_MODULE_LABEL: Record<ActivityModule, string> = {
  auth: "Autentikasi",
  akun: "Akun Saya",
  warta: "Warta",
  peribadahan: "Peribadahan",
  litbang: "Litbang",
  sarana_dana: "Sarana & Dana",
  tempat: "Tempat",
  wilayah: "Wilayah",
  jemaat: "Jemaat",
  label_jemaat: "Label Jemaat",
  users: "Pengguna",
  roles: "Roles & Permissions",
};

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  module: string;
  activity: string;
  ip_address: string | null;
  created_at: string;
}
