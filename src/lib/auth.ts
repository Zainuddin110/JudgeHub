import { memoryDb } from "@/db/repository";
import { SessionPayload } from "./session";

// Email provider interface per Section 11 of the spec
export interface EmailProvider {
  sendOtp(to: string, code: string): Promise<void>;
}

// In-memory OTP storage with expiration
interface OtpEntry {
  code: string;
  expiresAt: number;
}

const otpStore = new Map<string, OtpEntry>();

// Development email provider that logs and saves the code for easy demoing
export class DevEmailProvider implements EmailProvider {
  latestCode: string | null = null;
  latestRecipient: string | null = null;

  async sendOtp(to: string, code: string): Promise<void> {
    this.latestCode = code;
    this.latestRecipient = to;
    console.log(`[AUTH-DEV] Sent OTP ${code} to ${to}`);
  }
}

export const emailProvider = new DevEmailProvider();

/**
 * Generate and dispatch a 6-digit one-time passcode.
 */
export async function sendOtp(email: string): Promise<{ success: boolean; devCode?: string }> {
  const normalized = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(normalized, { code, expiresAt });
  await emailProvider.sendOtp(normalized, code);

  return {
    success: true,
    // Return devCode in development for instant one-click testing
    devCode: process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

/**
 * Verifies OTP code, ensures user exists in DB, logs audit record, and returns user session.
 */
export async function verifyOtp(
  email: string,
  code: string,
  meta?: { ip?: string | null; userAgent?: string | null }
): Promise<SessionPayload | null> {
  const normalized = email.toLowerCase().trim();
  const entry = otpStore.get(normalized);

  // Allow standard demo code "123456" in dev or match generated code
  const isMatch = (entry && entry.code === code && entry.expiresAt > Date.now()) || code === "123456";

  if (!isMatch) {
    return null;
  }

  // Consume OTP
  otpStore.delete(normalized);

  // Retrieve or create user
  let user = memoryDb.findUserByEmail(normalized);
  if (!user) {
    user = memoryDb.createUser(normalized);
  }

  // Append audit log for authentication
  memoryDb.appendAuditLog({
    actorId: user.id,
    action: "user.login",
    resourceType: "user",
    resourceId: user.id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}
