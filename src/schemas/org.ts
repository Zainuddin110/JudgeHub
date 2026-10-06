import { z } from "zod";

export const orgSettingsSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  timezone: z.string().default("UTC"),
  locale: z.string().default("en"),
}).catchall(z.unknown());

export type OrgSettings = z.infer<typeof orgSettingsSchema>;

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
  settings: orgSettingsSchema.default({}),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Organization = z.infer<typeof organizationSchema>;

export const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  settings: orgSettingsSchema.optional(),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;

export const membershipStatusSchema = z.enum(["invited", "active", "suspended"]);
export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

export const membershipSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  eventId: z.string().uuid().nullable().optional(),
  roleId: z.string().uuid(),
  status: membershipStatusSchema.default("active"),
  invitedBy: z.string().uuid().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Membership = z.infer<typeof membershipSchema>;
