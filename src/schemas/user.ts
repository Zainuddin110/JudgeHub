import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  locale: z.string().default("en"),
  timezone: z.string().default("UTC"),
  avatar: z.string().url().nullable().optional(),
  lastLogin: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof userSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  locale: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).max(50).optional(),
  avatar: z.string().url().nullable().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
