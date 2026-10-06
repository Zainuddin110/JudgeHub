import { describe, it, expect } from "vitest";
import { can, BUILTIN_ROLES } from "@/policy";
import { PolicySubject } from "@/schemas";

describe("can() Policy Matrix", () => {
  const orgId = "11111111-1111-1111-1111-111111111111";
  const eventId = "22222222-2222-2222-2222-222222222222";
  const userId = "33333333-3333-3333-3333-333333333333";

  it("grants super_admin access to all actions and resources", () => {
    const superAdmin: PolicySubject = {
      id: userId,
      isSuperAdmin: true,
      memberships: [],
    };

    expect(can(superAdmin, "org:delete", { type: "organization", organizationId: orgId })).toBe(true);
    expect(can(superAdmin, "event:publish", { type: "event", organizationId: orgId, eventId })).toBe(true);
    expect(can(superAdmin, "audit:read", { type: "audit", organizationId: orgId })).toBe(true);
  });

  it("enforces organization boundary for org_admin", () => {
    const orgAdmin: PolicySubject = {
      id: userId,
      memberships: [
        {
          organizationId: orgId,
          roleKey: "org_admin",
          permissions: BUILTIN_ROLES.org_admin.permissions,
        },
      ],
    };

    expect(can(orgAdmin, "event:create", { type: "event", organizationId: orgId })).toBe(true);
    expect(can(orgAdmin, "org:manage_members", { type: "organization", organizationId: orgId })).toBe(true);

    const otherOrgId = "99999999-9999-9999-9999-999999999999";
    expect(can(orgAdmin, "event:create", { type: "event", organizationId: otherOrgId })).toBe(false);
  });

  it("restricts event_organizer to their assigned event when eventId is present", () => {
    const organizer: PolicySubject = {
      id: userId,
      memberships: [
        {
          organizationId: orgId,
          eventId,
          roleKey: "event_organizer",
          permissions: BUILTIN_ROLES.event_organizer.permissions,
        },
      ],
    };

    expect(can(organizer, "event:configure", { type: "event", organizationId: orgId, eventId })).toBe(true);
    expect(can(organizer, "judge:assign", { type: "assignment", organizationId: orgId, eventId })).toBe(true);

    const otherEventId = "88888888-8888-8888-8888-888888888888";
    expect(can(organizer, "event:configure", { type: "event", organizationId: orgId, eventId: otherEventId })).toBe(false);
    expect(can(organizer, "org:manage_members", { type: "organization", organizationId: orgId })).toBe(false);
  });

  it("permits judge to score and read own evaluations but not all evaluations", () => {
    const judge: PolicySubject = {
      id: userId,
      memberships: [
        {
          organizationId: orgId,
          eventId,
          roleKey: "judge",
          permissions: BUILTIN_ROLES.judge.permissions,
        },
      ],
    };

    expect(can(judge, "evaluation:create", { type: "evaluation", organizationId: orgId, eventId })).toBe(true);
    expect(can(judge, "evaluation:read_own", { type: "evaluation", organizationId: orgId, eventId, judgeUserId: userId })).toBe(true);
    expect(can(judge, "evaluation:read_own", { type: "evaluation", organizationId: orgId, eventId, judgeUserId: "someone-else" })).toBe(false);
    expect(can(judge, "evaluation:read_all", { type: "evaluation", organizationId: orgId, eventId })).toBe(false);
  });

  it("allows participant to update only their own entry", () => {
    const participant: PolicySubject = {
      id: userId,
      memberships: [
        {
          organizationId: orgId,
          eventId,
          roleKey: "participant",
          permissions: BUILTIN_ROLES.participant.permissions,
        },
      ],
    };

    expect(can(participant, "entry:update", { type: "entry", organizationId: orgId, eventId, ownerId: userId })).toBe(true);
    expect(can(participant, "entry:update", { type: "entry", organizationId: orgId, eventId, ownerId: "other-user" })).toBe(false);
  });

  it("grants auditor read-only inspection rights", () => {
    const auditor: PolicySubject = {
      id: userId,
      memberships: [
        {
          organizationId: orgId,
          eventId,
          roleKey: "auditor",
          permissions: BUILTIN_ROLES.auditor.permissions,
        },
      ],
    };

    expect(can(auditor, "audit:read", { type: "audit", organizationId: orgId, eventId })).toBe(true);
    expect(can(auditor, "results:view_draft", { type: "results", organizationId: orgId, eventId })).toBe(true);
    expect(can(auditor, "event:configure", { type: "event", organizationId: orgId, eventId })).toBe(false);
    expect(can(auditor, "evaluation:create", { type: "evaluation", organizationId: orgId, eventId })).toBe(false);
  });

  it("handles unauthenticated subjects properly", () => {
    expect(can(null, "event:read", { type: "event", isPublic: true })).toBe(true);
    expect(can(null, "event:read", { type: "event", isPublic: false })).toBe(false);
    expect(can(null, "entry:create", { type: "entry" })).toBe(false);
  });
});
