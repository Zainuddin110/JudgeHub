import { z } from "zod";
import { permissionSchema, Permission } from "./roles";

export const policyCheckInputSchema = z.object({
  action: permissionSchema,
  resource: z.object({
    type: z.string(),
    organizationId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    ownerId: z.string().uuid().optional(),
  }).catchall(z.unknown()),
});

export type PolicyCheckInput = {
  action: Permission;
  resource: {
    type: string;
    organizationId?: string;
    eventId?: string;
    ownerId?: string;
    [key: string]: unknown;
  };
};

export interface PolicySubject {
  id: string;
  isSuperAdmin?: boolean;
  memberships: Array<{
    organizationId: string;
    eventId?: string | null;
    roleKey: string;
    permissions: Permission[];
  }>;
}
