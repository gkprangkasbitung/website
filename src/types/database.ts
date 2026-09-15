/**
 * Hand-written mirror of the Supabase schema (see supabase/migrations).
 *
 * Once the Supabase CLI is set up, replace this file by running:
 *   pnpm supabase gen types typescript --project-id <project-id> > src/types/database.ts
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          jemaat_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          jemaat_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          jemaat_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_jemaat_id_fkey";
            columns: ["jemaat_id"];
            isOneToOne: true;
            referencedRelation: "jemaat";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          resource: string;
          action: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          resource: string;
          action: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          resource?: string;
          action?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
        };
        Insert: {
          user_id: string;
          role_id: string;
        };
        Update: {
          user_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      warta: {
        Row: {
          id: string;
          slug: string;
          status: "draft" | "published";
          tanggal_kebaktian: string;
          judul_kebaktian: string;
          tema_kebaktian: string | null;
          renungan_judul: string | null;
          renungan_kitab: string | null;
          renungan_isi: string | null;
          renungan_sumber: string | null;
          created_by: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          status?: "draft" | "published";
          tanggal_kebaktian: string;
          judul_kebaktian: string;
          tema_kebaktian?: string | null;
          renungan_judul?: string | null;
          renungan_kitab?: string | null;
          renungan_isi?: string | null;
          renungan_sumber?: string | null;
          created_by?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          status?: "draft" | "published";
          tanggal_kebaktian?: string;
          judul_kebaktian?: string;
          tema_kebaktian?: string | null;
          renungan_judul?: string | null;
          renungan_kitab?: string | null;
          renungan_isi?: string | null;
          renungan_sumber?: string | null;
          created_by?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      peribadahan_categories: {
        Row: {
          id: string;
          key: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      peribadahan_items: {
        Row: {
          id: string;
          category_id: string;
          tanggal: string;
          jam: string | null;
          tempat_id: string | null;
          pelayan_firman_id: string | null;
          liturgos_id: string | null;
          wilayah_id: string | null;
          tema: string | null;
          dpa: string | null;
          catatan: string | null;
          kehadiran_laki_laki: number | null;
          kehadiran_perempuan: number | null;
          kehadiran_anak: number | null;
          pemusik_id: string | null;
          bahan_alkitab: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          tanggal: string;
          jam?: string | null;
          tempat_id?: string | null;
          pelayan_firman_id?: string | null;
          liturgos_id?: string | null;
          wilayah_id?: string | null;
          tema?: string | null;
          dpa?: string | null;
          catatan?: string | null;
          kehadiran_laki_laki?: number | null;
          kehadiran_perempuan?: number | null;
          kehadiran_anak?: number | null;
          pemusik_id?: string | null;
          bahan_alkitab?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          tanggal?: string;
          jam?: string | null;
          tempat_id?: string | null;
          pelayan_firman_id?: string | null;
          liturgos_id?: string | null;
          wilayah_id?: string | null;
          tema?: string | null;
          dpa?: string | null;
          catatan?: string | null;
          kehadiran_laki_laki?: number | null;
          kehadiran_perempuan?: number | null;
          kehadiran_anak?: number | null;
          pemusik_id?: string | null;
          bahan_alkitab?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "peribadahan_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "peribadahan_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "peribadahan_items_tempat_id_fkey";
            columns: ["tempat_id"];
            isOneToOne: false;
            referencedRelation: "tempat";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "peribadahan_items_pelayan_firman_id_fkey";
            columns: ["pelayan_firman_id"];
            isOneToOne: false;
            referencedRelation: "jemaat";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "peribadahan_items_liturgos_id_fkey";
            columns: ["liturgos_id"];
            isOneToOne: false;
            referencedRelation: "jemaat";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "peribadahan_items_pemusik_id_fkey";
            columns: ["pemusik_id"];
            isOneToOne: false;
            referencedRelation: "jemaat";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "peribadahan_items_wilayah_id_fkey";
            columns: ["wilayah_id"];
            isOneToOne: false;
            referencedRelation: "wilayah";
            referencedColumns: ["id"];
          },
        ];
      };
      wilayah: {
        Row: {
          id: string;
          nama: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      peribadahan_smka_kelompok: {
        Row: {
          id: string;
          item_id: string;
          kelompok: string;
          pf_id: string | null;
          laki_laki: number | null;
          perempuan: number | null;
        };
        Insert: {
          id?: string;
          item_id: string;
          kelompok: string;
          pf_id?: string | null;
          laki_laki?: number | null;
          perempuan?: number | null;
        };
        Update: {
          id?: string;
          item_id?: string;
          kelompok?: string;
          pf_id?: string | null;
          laki_laki?: number | null;
          perempuan?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "peribadahan_smka_kelompok_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "peribadahan_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "peribadahan_smka_kelompok_pf_id_fkey";
            columns: ["pf_id"];
            isOneToOne: false;
            referencedRelation: "jemaat";
            referencedColumns: ["id"];
          },
        ];
      };
      tempat: {
        Row: {
          id: string;
          nama: string;
          keterangan: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          keterangan?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          keterangan?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      jemaat: {
        Row: {
          id: string;
          nama: string;
          created_at: string;
          jenis_kelamin: string | null;
          alamat: string | null;
          wilayah_id: string | null;
          no_hp: string | null;
          tanggal_lahir: string | null;
          tanggal_masuk: string | null;
          sudah_baptis: boolean;
          sudah_sidi: boolean;
        };
        Insert: {
          id?: string;
          nama: string;
          created_at?: string;
          jenis_kelamin?: string | null;
          alamat?: string | null;
          wilayah_id?: string | null;
          no_hp?: string | null;
          tanggal_lahir?: string | null;
          tanggal_masuk?: string | null;
          sudah_baptis?: boolean;
          sudah_sidi?: boolean;
        };
        Update: {
          id?: string;
          nama?: string;
          created_at?: string;
          jenis_kelamin?: string | null;
          alamat?: string | null;
          wilayah_id?: string | null;
          no_hp?: string | null;
          tanggal_lahir?: string | null;
          tanggal_masuk?: string | null;
          sudah_baptis?: boolean;
          sudah_sidi?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "jemaat_wilayah_id_fkey";
            columns: ["wilayah_id"];
            isOneToOne: false;
            referencedRelation: "wilayah";
            referencedColumns: ["id"];
          },
        ];
      };
      label_jemaat: {
        Row: {
          id: string;
          nama: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      jemaat_labels: {
        Row: {
          jemaat_id: string;
          label_id: string;
        };
        Insert: {
          jemaat_id: string;
          label_id: string;
        };
        Update: {
          jemaat_id?: string;
          label_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jemaat_labels_jemaat_id_fkey";
            columns: ["jemaat_id"];
            isOneToOne: false;
            referencedRelation: "jemaat";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jemaat_labels_label_id_fkey";
            columns: ["label_id"];
            isOneToOne: false;
            referencedRelation: "label_jemaat";
            referencedColumns: ["id"];
          },
        ];
      };
      sarana_dana_items: {
        Row: {
          id: string;
          key: string;
          name: string;
          saldo_awal: number;
          keterangan: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          saldo_awal?: number;
          keterangan?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          saldo_awal?: number;
          keterangan?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sarana_dana_transactions: {
        Row: {
          id: string;
          item_id: string;
          tanggal: string;
          tipe: "masuk" | "keluar";
          jumlah: number;
          keterangan: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          tanggal: string;
          tipe: "masuk" | "keluar";
          jumlah: number;
          keterangan?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          tanggal?: string;
          tipe?: "masuk" | "keluar";
          jumlah?: number;
          keterangan?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sarana_dana_transactions_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "sarana_dana_items";
            referencedColumns: ["id"];
          },
        ];
      };
      sarana_dana_balances: {
        Row: {
          id: string;
          key: string;
          name: string;
          keterangan: string | null;
          saldo: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      litbang_categories: {
        Row: {
          id: string;
          name: string;
          deskripsi: string | null;
          active: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          deskripsi?: string | null;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          deskripsi?: string | null;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      warta_litbang_items: {
        Row: {
          id: string;
          warta_id: string;
          litbang_category_id: string | null;
          name: string;
          deskripsi: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          warta_id: string;
          litbang_category_id?: string | null;
          name: string;
          deskripsi?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          warta_id?: string;
          litbang_category_id?: string | null;
          name?: string;
          deskripsi?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "warta_litbang_items_warta_id_fkey";
            columns: ["warta_id"];
            isOneToOne: false;
            referencedRelation: "warta";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warta_litbang_items_litbang_category_id_fkey";
            columns: ["litbang_category_id"];
            isOneToOne: false;
            referencedRelation: "litbang_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      warta_kesaksian_items: {
        Row: {
          id: string;
          warta_id: string;
          judul: string;
          deskripsi: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          warta_id: string;
          judul: string;
          deskripsi?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          warta_id?: string;
          judul?: string;
          deskripsi?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "warta_kesaksian_items_warta_id_fkey";
            columns: ["warta_id"];
            isOneToOne: false;
            referencedRelation: "warta";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
