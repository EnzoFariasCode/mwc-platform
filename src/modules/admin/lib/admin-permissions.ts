export type AdminRole = "OWNER" | "FINANCE" | "SUPPORT";
export type AdminArea = "FINANCE" | "SUPPORT" | "USERS" | "DISPUTES";

export function normalizeAdminRole({
  userType,
  adminRole,
}: {
  userType?: string | null;
  adminRole?: AdminRole | null;
}) {
  if (userType !== "ADMIN") return null;
  return adminRole ?? "OWNER";
}

export function canAccessAdminRoles(
  adminRole: AdminRole | null | undefined,
  allowedRoles: AdminRole[],
) {
  return Boolean(adminRole && allowedRoles.includes(adminRole));
}

export function allowedAdminRolesForArea(area: AdminArea): AdminRole[] {
  if (area === "FINANCE") return ["OWNER", "FINANCE"];
  return ["OWNER", "SUPPORT"];
}

export function canAccessAdminArea(
  adminRole: AdminRole | null | undefined,
  area: AdminArea,
) {
  return canAccessAdminRoles(adminRole, allowedAdminRolesForArea(area));
}
