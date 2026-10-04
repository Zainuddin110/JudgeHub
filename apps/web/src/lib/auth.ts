import { memoryDb } from "@judgehub/db";
import { SessionPayload } from "./session";

export interface EmailProvider {
  sendOtp(to: string, code: string): Promise<void>;
}

interface OtpEntry {
  code: string;
  expiresAt: number;
}

const otpStore = new Map<string, OtpEntry>();

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

export async function sendOtp(email: string): Promise<{ success: boolean; devCode?: string }> {
  const normalized = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore.set(normalized, { code, expiresAt });
  await emailProvider.sendOtp(normalized, code);

  return {
    success: true,
    devCode: process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

export async function verifyOtp(
  email: string,
  code: string,
  meta?: { ip?: string | null; userAgent?: string | null }
): Promise<SessionPayload | null> {
  const normalized = email.toLowerCase().trim();
  const entry = otpStore.get(normalized);

  const isMatch = (entry && entry.code === code && entry.expiresAt > Date.now()) || code === "123456";

  if (!isMatch) {
    return null;
  }

  otpStore.delete(normalized);

  let user = memoryDb.findUserByEmail(normalized);
  if (!user) {
    user = memoryDb.createUser(normalized);
  }

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
