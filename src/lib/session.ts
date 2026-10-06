import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { StoredAuditRecord } from "@/db/audit";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "judgehub-development-session-secret-key-32chars"
);
const COOKIE_NAME = "judgehub_session";

export interface SessionOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
  createdAt: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string | null;
  organizations?: SessionOrg[];
  auditLogs?: StoredAuditRecord[];
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string | null | undefined,
      organizations: (payload.organizations as SessionOrg[]) || [],
      auditLogs: (payload.auditLogs as StoredAuditRecord[]) || [],
    };
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
