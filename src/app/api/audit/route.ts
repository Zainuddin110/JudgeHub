import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { memoryDb } from "@/db";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("organizationId") || undefined;

  const logs = memoryDb.listAuditLogs(orgId);
  const integrity = memoryDb.verifyAuditIntegrity();

  return NextResponse.json({
    logs: logs.slice().reverse(),
    integrity,
    count: logs.length,
  });
}
