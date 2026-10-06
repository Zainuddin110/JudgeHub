import { z } from "zod";

export const auditLogSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid().nullable().optional(),
  actorId: z.string().uuid().nullable().optional(),
  action: z.string().min(1).max(100),
  resourceType: z.string().min(1).max(50),
  resourceId: z.string().min(1).max(100),
  before: z.record(z.unknown()).nullable().optional(),
  after: z.record(z.unknown()).nullable().optional(),
  prevHash: z.string().nullable().optional(),
  hash: z.string().length(64),
  ip: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  at: z.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export const createAuditLogInputSchema = z.object({
  organizationId: z.string().uuid().nullable().optional(),
  actorId: z.string().uuid().nullable().optional(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  before: z.record(z.unknown()).nullable().optional(),
  after: z.record(z.unknown()).nullable().optional(),
  ip: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogInputSchema>;
