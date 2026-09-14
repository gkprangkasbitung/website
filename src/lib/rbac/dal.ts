import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AuthenticatedUser,
  Permission,
  PermissionAction,
  PermissionResource,
  Role,
} from "@/types/rbac";

/**
 * Verifies the Supabase session against the auth server (not just the
 * cookie) and redirects to /login if there isn't one. Cached per request so
 * calling it from multiple Server Components/layouts only hits Supabase once.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

type RoleRow = {
  roles: {
    id: string;
    name: string;
    description: string | null;
    role_permissions: {
      permissions: {
        id: string;
        resource: string;
        action: string;
        description: string | null;
      };
    }[];
  };
};

/**
 * Loads the current user's profile, roles and effective permissions.
 * This is the single source of truth for "what can this user do" -
 * Server Components, Server Actions and Route Handlers should all go
 * through this instead of re-deriving roles themselves.
 */
export const getAuthenticatedUser = cache(
  async (): Promise<AuthenticatedUser> => {
    const user = await verifySession();
    const supabase = await createClient();

    const [{ data: profile }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("user_roles")
        .select(
          "roles(id, name, description, role_permissions(permissions(id, resource, action, description)))",
        )
        .eq("user_id", user.id) as unknown as Promise<{ data: RoleRow[] | null }>,
    ]);

    const roles: Role[] = [];
    const permissionMap = new Map<string, Permission>();

    for (const row of roleRows ?? []) {
      const role = row.roles;
      if (!role) continue;
      roles.push({ id: role.id, name: role.name, description: role.description });
      for (const rp of role.role_permissions ?? []) {
        const p = rp.permissions;
        if (p) permissionMap.set(p.id, p as Permission);
      }
    }

    return {
      id: user.id,
      email: user.email ?? null,
      profile: profile ?? null,
      roles,
      permissions: Array.from(permissionMap.values()),
    };
  },
);

export function hasPermission(
  user: Pick<AuthenticatedUser, "permissions">,
  resource: PermissionResource,
  action: PermissionAction,
): boolean {
  return user.permissions.some(
    (p) => p.resource === resource && p.action === action,
  );
}

/**
 * For Server Components / layouts / Server Actions: loads the current user
 * and redirects to /admin (with nothing rendered) if they lack the
 * permission. Redirecting here is a UX nicety only - the corresponding
 * Supabase RLS policy is what actually blocks the data access.
 */
export async function requirePermission(
  resource: PermissionResource,
  action: PermissionAction,
) {
  const user = await getAuthenticatedUser();

  if (!hasPermission(user, resource, action)) {
    redirect("/admin?error=forbidden");
  }

  return user;
}

/**
 * For Route Handlers, where throwing a redirect isn't appropriate: returns
 * either the authenticated user or a plain object describing the HTTP
 * status to respond with.
 */
export async function requirePermissionApi(
  resource: PermissionResource,
  action: PermissionAction,
): Promise<
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; status: 401 | 403 }
> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { ok: false, status: 401 };
  }

  const user = await getAuthenticatedUser();

  if (!hasPermission(user, resource, action)) {
    return { ok: false, status: 403 };
  }

  return { ok: true, user };
}
