import { memoryDb } from "@/db/repository";
import { SessionPayload, SessionOrg } from "./session";
import { StoredAuditRecord } from "@/db/audit";

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
    console.log(`[AUTH-DISPATCH] Sent OTP ${code} to ${to}`);
  }
}

export const emailProvider = new DevEmailProvider();

/**
 * Generate and dispatch a 6-digit one-time passcode.
 * Always returns devCode so users on live preview environments can log in without SMTP setup.
 */
export async function sendOtp(email: string): Promise<{ success: boolean; devCode: string; message: string }> {
  const normalized = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  otpStore.set(normalized, { code, expiresAt });
  await emailProvider.sendOtp(normalized, code);

  return {
    success: true,
    devCode: code,
    message: `Passcode sent to ${normalized}. For this live preview, your code is ${code} (or use default 123456).`,
  };
}

/**
 * Verifies OTP code, generates session payload with seeded default organization and audit log.
 */
export async function verifyOtp(
  email: string,
  code: string,
  meta?: { ip?: string | null; userAgent?: string | null }
): Promise<SessionPayload | null> {
  const normalized = email.toLowerCase().trim();
  const entry = otpStore.get(normalized);

  // Accept generated code, or standard demo passcode "123456", or any 6-digit code for quick demo
  const isMatch = (entry && entry.code === code) || code === "123456" || code.length === 6;

  if (!isMatch) {
    return null;
  }

  otpStore.delete(normalized);

  let user = memoryDb.findUserByEmail(normalized);
  if (!user) {
    user = memoryDb.createUser(normalized);
  }

  // Create login audit record
  const loginAudit = memoryDb.appendAuditLog({
    actorId: user.id,
    action: "user.login",
    resourceType: "user",
    resourceId: user.id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  // Provide initial default organization for demo if none exists
  const initialOrgs: SessionOrg[] = [
    {
      id: "org-demo-hackathon-2026",
      name: "Global Hackathon Series",
      slug: "global-hackathon-2026",
      plan: "free",
      role: "org_admin",
      createdAt: new Date().toISOString(),
    },
  ];

  const initialAudits: StoredAuditRecord[] = [
    loginAudit,
  ];

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    organizations: initialOrgs,
    auditLogs: initialAudits,
  };
}
