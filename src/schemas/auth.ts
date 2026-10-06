import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  code: z.string().min(4).max(8).trim(),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const authSessionSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  createdAt: z.string(),
  expiresAt: z.string(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;
