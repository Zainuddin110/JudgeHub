import { z } from "zod";

export const PERMISSIONS = [
  "org:create",
  "org:read",
  "org:update",
  "org:delete",
  "org:manage_members",
  
  "event:create",
  "event:read",
  "event:update",
  "event:delete",
  "event:configure",
  "event:publish",
  
  "entry:create",
  "entry:read",
  "entry:update",
  "entry:delete",
  "entry:disqualify",
  
  "judge:invite",
  "judge:manage",
  "judge:assign",
  
  "evaluation:create",
  "evaluation:read_own",
  "evaluation:read_all",
  "evaluation:submit",
  "evaluation:unlock",
  
  "results:compute",
  "results:view_draft",
  "results:finalize",
  "results:publish",
  
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const permissionSchema = z.enum(PERMISSIONS);

export const roleSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid().nullable().optional(),
  key: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  permissions: z.array(permissionSchema),
  isBuiltin: z.boolean().default(false),
  createdAt: z.date().optional(),
});

export type Role = z.infer<typeof roleSchema>;
