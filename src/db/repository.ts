import { randomUUID } from "node:crypto";
import { computeAuditHash, verifyAuditChainIntegrity, StoredAuditRecord, AuditRecordPayload } from "./audit";
import { BUILTIN_ROLES } from "@/policy";

export interface UserEntity {
  id: string;
  email: string;
  name?: string | null;
  locale: string;
  timezone: string;
  avatar?: string | null;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleEntity {
  id: string;
  organizationId?: string | null;
  key: string;
  name: string;
  permissions: string[];
  isBuiltin: boolean;
  createdAt: Date;
}

export interface MembershipEntity {
  id: string;
  userId: string;
  organizationId: string;
  eventId?: string | null;
  roleId: string;
  status: string;
  invitedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryDatabase {
  users: Map<string, UserEntity> = new Map();
  organizations: Map<string, OrganizationEntity> = new Map();
  roles: Map<string, RoleEntity> = new Map();
  memberships: Map<string, MembershipEntity> = new Map();
  auditLogs: StoredAuditRecord[] = [];

  constructor() {
    this.seedBuiltinRoles();
  }

  private seedBuiltinRoles() {
    for (const [key, roleDef] of Object.entries(BUILTIN_ROLES)) {
      const id = randomUUID();
      this.roles.set(id, {
        id,
        key: roleDef.key,
        name: roleDef.name,
        permissions: roleDef.permissions,
        isBuiltin: true,
        createdAt: new Date(),
      });
    }
  }

  createUser(email: string, name?: string | null): UserEntity {
    const existing = this.findUserByEmail(email);
    if (existing) return existing;

    const user: UserEntity = {
      id: randomUUID(),
      email: email.toLowerCase().trim(),
      name: name || null,
      locale: "en",
      timezone: "UTC",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  findUserByEmail(email: string): UserEntity | undefined {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email === normalized) return user;
    }
    return undefined;
  }

  findUserById(id: string): UserEntity | undefined {
    return this.users.get(id);
  }

  createOrganization(input: {
    name: string;
    slug: string;
    creatorUserId: string;
    settings?: Record<string, unknown>;
  }): { organization: OrganizationEntity; membership: MembershipEntity; auditRecord: StoredAuditRecord } {
    if (this.findOrgBySlug(input.slug)) {
      throw new Error(`Organization slug "${input.slug}" is already taken`);
    }

    const org: OrganizationEntity = {
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      plan: "free",
      settings: input.settings || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(org.id, org);

    const orgAdminRole = Array.from(this.roles.values()).find((r) => r.key === "org_admin");
    if (!orgAdminRole) {
      throw new Error("Default org_admin role not found");
    }

    const membership: MembershipEntity = {
      id: randomUUID(),
      userId: input.creatorUserId,
      organizationId: org.id,
      roleId: orgAdminRole.id,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memberships.set(membership.id, membership);

    const auditRecord = this.appendAuditLog({
      organizationId: org.id,
      actorId: input.creatorUserId,
      action: "org.created",
      resourceType: "organization",
      resourceId: org.id,
      after: { name: org.name, slug: org.slug },
    });

    return { organization: org, membership, auditRecord };
  }

  findOrgBySlug(slug: string): OrganizationEntity | undefined {
    for (const org of this.organizations.values()) {
      if (org.slug === slug) return org;
    }
    return undefined;
  }

  findOrgById(id: string): OrganizationEntity | undefined {
    return this.organizations.get(id);
  }

  listOrganizationsForUser(userId: string): Array<{ org: OrganizationEntity; role: RoleEntity }> {
    const results: Array<{ org: OrganizationEntity; role: RoleEntity }> = [];
    for (const m of this.memberships.values()) {
      if (m.userId === userId && m.status === "active") {
        const org = this.organizations.get(m.organizationId);
        const role = this.roles.get(m.roleId);
        if (org && role) {
          results.push({ org, role });
        }
      }
    }
    return results;
  }

  appendAuditLog(payload: AuditRecordPayload): StoredAuditRecord {
    const at = payload.at || new Date();
    const lastRecord = this.auditLogs.length > 0 ? this.auditLogs[this.auditLogs.length - 1] : null;
    const prevHash = lastRecord ? lastRecord.hash : null;

    const hash = computeAuditHash(prevHash, {
      ...payload,
      at,
    });

    const record: StoredAuditRecord = {
      ...payload,
      id: randomUUID(),
      prevHash,
      hash,
      at,
    };

    this.auditLogs.push(record);
    return record;
  }

  listAuditLogs(organizationId?: string): StoredAuditRecord[] {
    if (!organizationId) {
      return [...this.auditLogs];
    }
    return this.auditLogs.filter((l) => l.organizationId === organizationId);
  }

  verifyAuditIntegrity(): { valid: boolean; brokenIndex?: number; reason?: string } {
    return verifyAuditChainIntegrity(this.auditLogs);
  }
}

export const memoryDb = new InMemoryDatabase();
