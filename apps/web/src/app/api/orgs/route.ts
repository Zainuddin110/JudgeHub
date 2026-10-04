import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { createOrgSchema } from "@judgehub/schemas";
import { memoryDb } from "@judgehub/db";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
  }

  const list = memoryDb.listOrganizationsForUser(session.userId);
  return NextResponse.json({
    organizations: list.map((item) => ({
      id: item.org.id,
      name: item.org.name,
      slug: item.org.slug,
      plan: item.org.plan,
      role: item.role.key,
    })),
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

    const { organization, membership, auditRecord } = memoryDb.createOrganization({
      name: parsed.data.name,
      slug: parsed.data.slug,
      creatorUserId: session.userId,
      settings: parsed.data.settings,
    });

    return NextResponse.json({
      success: true,
      organization,
      membership,
      auditRecord,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ code: "BAD_REQUEST", message }, { status: 400 });
  }
}
