import { Permission, PolicySubject } from "@/schemas";

export interface ResourceContext {
  type: string;
  organizationId?: string;
  eventId?: string;
  ownerId?: string;
  judgeUserId?: string;
  [key: string]: unknown;
}

export function can(
  subject: PolicySubject | null | undefined,
  action: Permission,
  resource: ResourceContext
): boolean {
  if (!subject) {
    return action === "event:read" && resource.type === "event" && resource.isPublic === true;
  }

  if (subject.isSuperAdmin) {
    return true;
  }

  for (const membership of subject.memberships) {
    if (resource.organizationId && membership.organizationId !== resource.organizationId) {
      continue;
    }

    if (membership.eventId && resource.eventId && membership.eventId !== resource.eventId) {
      continue;
    }

    if (membership.permissions.includes(action)) {
      if (action === "entry:update" && membership.roleKey === "participant") {
        if (resource.ownerId && resource.ownerId !== subject.id) {
          continue;
        }
      }

      if (action === "evaluation:read_own" && membership.roleKey === "judge") {
        if (resource.judgeUserId && resource.judgeUserId !== subject.id) {
          continue;
        }
      }

      return true;
    }
  }

  return false;
}
