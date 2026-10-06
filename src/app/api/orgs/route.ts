import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, createSessionToken, getSessionCookieOptions, SessionOrg } from "@/lib/session";
import { createOrgSchema } from "@/schemas";
import { memoryDb } from "@/db/repository";
import { randomUUID } from "node:crypto";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
  }

  // Combine session-cached orgs with memoryDb orgs
  const dbOrgs = memoryDb.listOrganizationsForUser(session.userId);
  const sessionOrgs = session.organizations || [];

  const combinedMap = new Map<string, SessionOrg>();
  for (const org of sessionOrgs) {
    combinedMap.set(org.id, org);
  }
  for (const item of dbOrgs) {
    combinedMap.set(item.org.id, {
      id: item.org.id,
      name: item.org.name,
      slug: item.org.slug,
      plan: item.org.plan,
      role: item.role.key,
      createdAt: item.org.createdAt.toISOString(),
    });
  }

  return NextResponse.json({
    organizations: Array.from(combinedMap.values()),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createOrgSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid organization data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Append to memory DB
    const { organization, membership, auditRecord } = memoryDb.createOrganization({
      name: parsed.data.name,
      slug: parsed.data.slug,
      creatorUserId: session.userId,
      settings: parsed.data.settings,
    });

    // Create session org item
    const newSessionOrg: SessionOrg = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      plan: organization.plan,
      role: "org_admin",
      createdAt: organization.createdAt.toISOString(),
    };

    const updatedOrgs = [...(session.organizations || []), newSessionOrg];
    const updatedAudits = [...(session.auditLogs || []), auditRecord];

    // Re-sign session cookie to persist across serverless instances
    const newSessionToken = await createSessionToken({
      ...session,
      organizations: updatedOrgs,
      auditLogs: updatedAudits,
    });

    const response = NextResponse.json({
      success: true,
      organization,
      membership,
      auditRecord,
    });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set(cookieOpts.name, newSessionToken, cookieOpts);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ code: "BAD_REQUEST", message }, { status: 400 });
  }
}
