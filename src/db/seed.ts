import { BUILTIN_ROLES } from "@/policy";

export function getBuiltinRolesSeedData() {
  return Object.values(BUILTIN_ROLES).map((role) => ({
    key: role.key,
    name: role.name,
    permissions: role.permissions,
    isBuiltin: true,
  }));
}
