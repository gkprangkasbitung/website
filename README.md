# GKP Rangkasbitung — Website

Website resmi (publik) dan panel admin internal (RBAC) untuk GKP Rangkasbitung.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) — Auth, Postgres, Row Level Security
- Next.js Route Handlers sebagai backend API

## Struktur Project

```
src/
  app/
    (public)/          # Website publik - beranda, tentang, jadwal ibadah, kontak
    (admin)/admin/      # Panel admin internal, dilindungi auth + RBAC
    login/              # Halaman login admin
    auth/callback/       # Callback OAuth/magic link Supabase (opsional)
    api/admin/          # Route Handlers (backend) untuk operasi CRUD RBAC
  lib/
    supabase/           # Browser client, server client, session refresh
    rbac/dal.ts         # Data Access Layer: verifySession, requirePermission, dst
  types/
    rbac.ts             # Tipe Role, Permission, AuthenticatedUser
    database.ts         # Tipe tabel Supabase (mirror dari supabase/migrations)
  proxy.ts               # Pengganti middleware.ts (konvensi baru Next.js 16)
supabase/
  migrations/           # SQL schema RBAC + seed role/permission
```

## Model RBAC

Tabel: `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`.
Permission berbentuk `resource:action`, contoh `users:update`, `roles:read`.

Role default (lihat `supabase/migrations/0002_seed_rbac.sql`):

| Role        | Akses                                                          |
| ----------- | --------------------------------------------------------------- |
| super_admin | Semua permission, termasuk mengelola roles & permissions        |
| admin       | Kelola pengguna (read/update) + full CRUD announcements/content |
| editor      | Create/read/update announcements & content                      |
| viewer      | Read-only announcements & content                                |

Enforcement berlapis:
1. **`src/proxy.ts`** — optimistic check, redirect ke `/login` jika belum ada session.
2. **`src/lib/rbac/dal.ts`** — `requirePermission()` (Server Component/Action) dan `requirePermissionApi()` (Route Handler) memverifikasi permission sebelum data diakses.
3. **Supabase RLS** — baris pertahanan terakhir di level database (lihat `supabase/migrations/0001_rbac_schema.sql`), jadi tetap aman walau ada bug di application layer.

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Buat project Supabase

Buat project baru di [supabase.com](https://supabase.com), lalu salin `.env.local.example` menjadi `.env.local` dan isi dengan Project URL + anon key (Project Settings → API).

```bash
cp .env.local.example .env.local
```

### 3. Jalankan migration

Buka Supabase SQL Editor, jalankan isi file berikut secara berurutan:

1. `supabase/migrations/0001_rbac_schema.sql`
2. `supabase/migrations/0002_seed_rbac.sql`

### 4. Buat user admin pertama

Di Supabase Dashboard → Authentication → Users, buat/undang user pertama (email + password). Setelah login sekali (trigger otomatis membuat baris `profiles`), assign role `super_admin` secara manual lewat SQL Editor:

```sql
insert into public.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u, public.roles r
where u.email = 'email-admin-pertama@example.com'
  and r.name = 'super_admin';
```

Setelah itu, penambahan/pengubahan role user berikutnya bisa dilakukan lewat halaman `/admin/users`.

### 5. Jalankan development server

```bash
pnpm dev
```

- Website publik: [http://localhost:3000](http://localhost:3000)
- Login admin: [http://localhost:3000/login](http://localhost:3000/login)
- Panel admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Menambah Resource RBAC Baru

1. Tambahkan nama resource ke `PermissionResource` di `src/types/rbac.ts`.
2. Tambahkan baris permission (`resource`/`action`) di migration seed atau lewat halaman Roles & Permissions.
3. Pakai `requirePermission("resource", "action")` di Server Component/Action, atau `requirePermissionApi(...)` di Route Handler, sebelum membaca/menulis data resource tersebut.
4. Tambahkan RLS policy senada di Supabase untuk tabel resource tersebut (contoh ada di `0001_rbac_schema.sql`).

## Catatan Next.js 16

Project ini pakai `src/proxy.ts`, bukan `middleware.ts` — Next.js 16 me-rename konvensi tersebut menjadi "Proxy". Lihat `node_modules/next/dist/docs` untuk detail perubahan lain jika ada breaking change yang belum familiar.
