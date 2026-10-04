import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { memoryDb } from "@judgehub/db";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = memoryDb.findUserById(session.userId);
  const orgs = memoryDb.listOrganizationsForUser(session.userId);

  return NextResponse.json({
    user: user || session,
    organizations: orgs.map((o) => ({
      id: o.org.id,
      name: o.org.name,
      slug: o.org.slug,
      role: o.role.key,
    })),
  });
}
