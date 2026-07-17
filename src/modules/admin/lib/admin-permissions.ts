export type AdminRole = "OWNER" | "FINANCE" | "SUPPORT";
export type AdminArea = "FINANCE" | "SUPPORT" | "USERS" | "DISPUTES";
export type AdminAuditEntityType =
  | "TECH_PROJECT"
  | "HEALTH_APPOINTMENT"
  | "WITHDRAWAL_REQUEST"
  | "USER_ACCOUNT"
  | "APPOINTMENT_CANCELLATION"
  | "APPOINTMENT_RESCHEDULE"
  | "PROFESSIONAL_VERIFICATION";

const adminAuditRolesByEntity = {
  TECH_PROJECT: ["OWNER", "SUPPORT"],
  HEALTH_APPOINTMENT: ["OWNER", "SUPPORT"],
  WITHDRAWAL_REQUEST: ["OWNER", "FINANCE"],
  USER_ACCOUNT: ["OWNER", "SUPPORT"],
  APPOINTMENT_CANCELLATION: ["OWNER", "FINANCE", "SUPPORT"],
  APPOINTMENT_RESCHEDULE: ["OWNER", "FINANCE", "SUPPORT"],
  PROFESSIONAL_VERIFICATION: ["OWNER", "SUPPORT"],
} satisfies Record<AdminAuditEntityType, AdminRole[]>;

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

export function allowedAdminRolesForAuditEntity(
  entityType: string,
): AdminRole[] {
  if (!Object.hasOwn(adminAuditRolesByEntity, entityType)) return [];

  return adminAuditRolesByEntity[entityType as AdminAuditEntityType];
}
