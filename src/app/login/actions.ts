"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email atau password salah." };
  }

  await logActivity({
    userId: data.user.id,
    userEmail: data.user.email ?? null,
    module: "auth",
    activity: "Login",
  });

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logActivity({
      userId: user.id,
      userEmail: user.email ?? null,
      module: "auth",
      activity: "Logout",
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}
