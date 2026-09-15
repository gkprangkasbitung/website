import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Atur Password</h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang, {user.email}. Buat password untuk akun kamu.
          </p>
        </div>
        <SetPasswordForm />
      </div>
    </div>
  );
}
