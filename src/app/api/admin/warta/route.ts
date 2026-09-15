import { NextResponse } from "next/server";
import { requirePermissionApi } from "@/lib/rbac/dal";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const auth = await requirePermissionApi("warta", "read");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warta")
    .select("*")
    .order("tanggal_kebaktian", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requirePermissionApi("warta", "create");
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const tanggalKebaktian = body?.tanggal_kebaktian;
  const judulKebaktian = body?.judul_kebaktian;

  if (typeof tanggalKebaktian !== "string" || !tanggalKebaktian) {
    return NextResponse.json({ error: "Tanggal kebaktian wajib diisi" }, { status: 400 });
  }
  if (typeof judulKebaktian !== "string" || !judulKebaktian.trim()) {
    return NextResponse.json({ error: "Judul kebaktian wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();

  const baseSlug = slugify(`${tanggalKebaktian}-${judulKebaktian}`) || "warta";
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("warta")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: warta, error: insertError } = await supabase
    .from("warta")
    .insert({
      slug,
      tanggal_kebaktian: tanggalKebaktian,
      judul_kebaktian: judulKebaktian.trim(),
      tema_kebaktian: body?.tema_kebaktian ?? null,
      renungan_judul: body?.renungan_judul ?? null,
      renungan_kitab: body?.renungan_kitab ?? null,
      renungan_isi: body?.renungan_isi ?? null,
      renungan_sumber: body?.renungan_sumber ?? null,
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (insertError || !warta) {
    return NextResponse.json({ error: insertError?.message ?? "Gagal membuat warta" }, { status: 400 });
  }

  // Snapshot the current (active) Litbang template into this warta's own
  // independent rows. Inactive cards are skipped - they stay in the
  // template for later reactivation but shouldn't appear in new warta.
  const { data: template } = await supabase
    .from("litbang_categories")
    .select("id, name, deskripsi, sort_order")
    .eq("active", true)
    .order("sort_order");

  if (template && template.length > 0) {
    const { error: snapshotError } = await supabase.from("warta_litbang_items").insert(
      template.map((item) => ({
        warta_id: warta.id,
        litbang_category_id: item.id,
        name: item.name,
        deskripsi: item.deskripsi,
        sort_order: item.sort_order,
      })),
    );

    if (snapshotError) {
      return NextResponse.json(
        { error: `Warta dibuat, tapi gagal menyalin Litbang: ${snapshotError.message}` },
        { status: 207 },
      );
    }
  }

  return NextResponse.json({ data: warta }, { status: 201 });
}
