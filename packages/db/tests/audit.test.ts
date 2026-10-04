import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryDatabase } from "../src";

describe("Audit Log & Hash Chain Integrity", () => {
  let db: InMemoryDatabase;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  it("appends audit logs with proper hash-chaining", () => {
    const user = db.createUser("organizer@example.com", "Organizer");

    const record1 = db.appendAuditLog({
      actorId: user.id,
      action: "user.login",
      resourceType: "user",
      resourceId: user.id,
    });

    expect(record1.prevHash).toBeNull();
    expect(record1.hash).toHaveLength(64);

    const record2 = db.appendAuditLog({
      actorId: user.id,
      action: "settings.update",
      resourceType: "settings",
      resourceId: "global",
    });

    expect(record2.prevHash).toBe(record1.hash);
    expect(record2.hash).toHaveLength(64);

    const integrity = db.verifyAuditIntegrity();
    expect(integrity.valid).toBe(true);
  });

  it("detects tampered record content in the chain", () => {
    const user = db.createUser("admin@example.com");

    db.appendAuditLog({
      actorId: user.id,
      action: "event.create",
      resourceType: "event",
      resourceId: "evt-1",
    });

    db.appendAuditLog({
      actorId: user.id,
      action: "score.submit",
      resourceType: "evaluation",
      resourceId: "eval-1",
    });

    db.auditLogs[0].action = "event.DELETE_MALICIOUS";

    const integrity = db.verifyAuditIntegrity();
    expect(integrity.valid).toBe(false);
    expect(integrity.brokenIndex).toBe(0);
    expect(integrity.reason).toContain("corrupted content");
  });

  it("detects deleted records in the chain", () => {
    const user = db.createUser("admin@example.com");

    db.appendAuditLog({ actorId: user.id, action: "action.1", resourceType: "type.1", resourceId: "res-1" });
    db.appendAuditLog({ actorId: user.id, action: "action.2", resourceType: "type.2", resourceId: "res-2" });
    db.appendAuditLog({ actorId: user.id, action: "action.3", resourceType: "type.3", resourceId: "res-3" });

    db.auditLogs.splice(1, 1);

    const integrity = db.verifyAuditIntegrity();
    expect(integrity.valid).toBe(false);
    expect(integrity.brokenIndex).toBe(1);
    expect(integrity.reason).toContain("invalid prevHash");
  });

  it("creates organization, assigns org_admin membership, and creates audit record", () => {
    const user = db.createUser("founder@judgehub.io", "Founder");
    const { organization, membership, auditRecord } = db.createOrganization({
      name: "Acme Hackathon Org",
      slug: "acme-hackathon",
      creatorUserId: user.id,
    });

    expect(organization.id).toBeDefined();
    expect(organization.slug).toBe("acme-hackathon");
    expect(membership.userId).toBe(user.id);
    expect(membership.organizationId).toBe(organization.id);

    expect(auditRecord.action).toBe("org.created");
    expect(auditRecord.organizationId).toBe(organization.id);
    expect(auditRecord.actorId).toBe(user.id);

    expect(db.verifyAuditIntegrity().valid).toBe(true);

    const userOrgs = db.listOrganizationsForUser(user.id);
    expect(userOrgs).toHaveLength(1);
    expect(userOrgs[0].org.name).toBe("Acme Hackathon Org");
    expect(userOrgs[0].role.key).toBe("org_admin");
  });
});
