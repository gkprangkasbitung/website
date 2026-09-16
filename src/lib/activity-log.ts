import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ActivityModule } from "@/types/activity-log";

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return h.get("x-real-ip");
}

/**
 * Records one row in the append-only activity log. Never throws - a
 * logging failure must not break the action it's describing, so errors are
 * swallowed after a console warning.
 */
export async function logActivity(params: {
  userId: string;
  userEmail: string | null;
  module: ActivityModule;
  activity: string;
}) {
  try {
    const supabase = await createClient();
    const ip = await getClientIp();
    const { error } = await supabase.from("activity_logs").insert({
      user_id: params.userId,
      user_email: params.userEmail,
      module: params.module,
      activity: params.activity,
      ip_address: ip,
    });

    if (error) {
      console.error("logActivity failed:", error.message);
    }
  } catch (err) {
    console.error("logActivity failed:", err);
  }
}
