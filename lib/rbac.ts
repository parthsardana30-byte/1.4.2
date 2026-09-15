export const roles = ["admin", "editor", "viewer"] as const;
export type Role = (typeof roles)[number];

export const permissions = [
  "dashboard.view", "content.view", "content.create", "content.edit",
  "content.publish", "users.view", "users.manage", "analytics.view",
] as const;
export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<Role, readonly Permission[]> = {
  admin: permissions,
  editor: ["dashboard.view", "content.view", "content.create", "content.edit", "content.publish", "analytics.view"],
  viewer: ["dashboard.view", "content.view", "analytics.view"],
};

export const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  editor: "Content editor",
  viewer: "Read-only viewer",
};

export function isPermission(value: string): value is Permission {
  return permissions.includes(value as Permission);
}

export function can(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
