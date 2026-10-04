import { createHash } from "node:crypto";

export interface AuditRecordPayload {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  at?: Date;
}

export interface StoredAuditRecord extends AuditRecordPayload {
  id: string;
  prevHash: string | null;
  hash: string;
  at: Date;
}

export function computeAuditHash(
  prevHash: string | null | undefined,
  record: {
    organizationId?: string | null;
    actorId?: string | null;
    action: string;
    resourceType: string;
    resourceId: string;
    before?: unknown;
    after?: unknown;
    at: Date | string;
  }
): string {
  const normalizedDate = record.at instanceof Date ? record.at.toISOString() : record.at;
  const canonicalString = JSON.stringify({
    prevHash: prevHash || null,
    organizationId: record.organizationId || null,
    actorId: record.actorId || null,
    action: record.action,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    before: record.before || null,
    after: record.after || null,
    at: normalizedDate,
  });

  return createHash("sha256").update(canonicalString).digest("hex");
}

export function verifyAuditChainIntegrity(records: StoredAuditRecord[]): {
  valid: boolean;
  brokenIndex?: number;
  reason?: string;
} {
  if (records.length === 0) {
    return { valid: true };
  }

  for (let i = 0; i < records.length; i++) {
    const current = records[i];
    const prev = i > 0 ? records[i - 1] : null;

    const expectedPrevHash = prev ? prev.hash : null;
    if (current.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Record ${current.id} at index ${i} has invalid prevHash. Expected "${expectedPrevHash}", found "${current.prevHash}".`,
      };
    }

    const computedHash = computeAuditHash(current.prevHash, current);
    if (computedHash !== current.hash) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Record ${current.id} at index ${i} has corrupted content. Expected hash "${computedHash}", stored "${current.hash}".`,
      };
    }
  }

  return { valid: true };
}
