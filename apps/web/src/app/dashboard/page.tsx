import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { memoryDb, StoredAuditRecord } from "@judgehub/db";
import {
  Building2,
  Plus,
  ShieldCheck,
  UserCheck,
  LogOut,
  Hash,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const user = memoryDb.findUserById(session.userId);
  const organizations = memoryDb.listOrganizationsForUser(session.userId);
  const auditLogs = memoryDb.listAuditLogs().slice().reverse();
  const integrity = memoryDb.verifyAuditIntegrity();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200 dark:shadow-none">
                J
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                JudgeHub
              </span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium dark:bg-slate-800 dark:text-slate-400">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>{user?.email || session.email}</span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Your Organizations
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tenant spaces you manage or participate in.
              </p>
            </div>
            <Link
              href="/orgs/new"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Organization
            </Link>
          </div>

          {organizations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Building2 className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                No organizations yet
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Create your first organization to configure events, define stages, and invite judges.
              </p>
              <div className="mt-6">
                <Link
                  href="/orgs/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Organization
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map(({ org, role }) => (
                <div
                  key={org.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 transition-colors dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {org.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        slug: {org.slug}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {role.name}
                    </span>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span>Plan: {org.plan.toUpperCase()}</span>
                    <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Append-Only Audit Log
                </h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Every action is cryptographically hash-chained using SHA-256 for provable integrity.
              </p>
            </div>

            {integrity.valid ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Chain Integrity Verified ({auditLogs.length} Records)
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-700 border border-red-200 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
                Chain Tamper Detected: {integrity.reason}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 rounded-r-lg">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No audit entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: StoredAuditRecord) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {log.resourceType}:{log.resourceId.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {log.actorId ? log.actorId.slice(0, 8) + "..." : "system"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 max-w-xs truncate" title={log.hash}>
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3 w-3 text-indigo-400" />
                          {log.hash.slice(0, 16)}...
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
