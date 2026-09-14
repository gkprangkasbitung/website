import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next && next.startsWith("/admin") ? next : "/admin");
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Masuk Admin</h1>
          <p className="text-sm text-muted-foreground">
            Khusus untuk pengurus dan admin GKP Rangkasbitung.
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
