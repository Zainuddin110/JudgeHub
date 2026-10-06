import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { memoryDb } from "@/db/repository";
import { verifyAuditChainIntegrity, StoredAuditRecord } from "@/db/audit";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("organizationId") || undefined;

  // Combine session-cached audit logs with memoryDb logs
  const dbLogs = memoryDb.listAuditLogs(orgId);
  const sessionLogs = session.auditLogs || [];

  const combinedMap = new Map<string, StoredAuditRecord>();
  for (const log of sessionLogs) {
    combinedMap.set(log.id, log);
  }
  for (const log of dbLogs) {
    combinedMap.set(log.id, log);
  }

  const logs = Array.from(combinedMap.values());
  const integrity = verifyAuditChainIntegrity(logs);

  return NextResponse.json({
    logs: logs.slice().reverse(),
    integrity,
    count: logs.length,
  });
}
