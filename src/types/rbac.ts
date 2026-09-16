export type PermissionAction = "create" | "read" | "update" | "delete";

/** Add new resource names here as the admin app grows. */
export type PermissionResource =
  | "users"
  | "roles"
  | "announcements"
  | "content"
  | "warta"
  | "activity_log";

export interface Permission {
  id: string;
  resource: PermissionResource;
  action: PermissionAction;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  profile: Profile | null;
  roles: Role[];
  permissions: Permission[];
}
