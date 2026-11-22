import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/actions/auth-actions";
import { listDistributorsAction, getPlatformAuditLogsAction } from "@/lib/actions/admin-actions";
import { ShieldCheck, Building2, Users, AlertTriangle, Activity } from "lucide-react";
import AdminClientActions from "./admin-client";

export default async function AdminPortalPage() {
  const session = await getCurrentSession();

  // Enforce SUPER_ADMIN guard
  if (!session?.user) {
    redirect("/login");
  }
  if ((session.user as any).platformRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const distributors = await listDistributorsAction();
  const auditLogs = await getPlatformAuditLogsAction(10);

  const totalCount = distributors.length;
  const activeCount = distributors.filter((d) => d.status === "ACTIVE").length;
  const suspendedCount = distributors.filter((d) => d.status === "SUSPENDED").length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Platform Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              SaaS Platform Control Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Platform Administration
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Signed in as <span className="text-indigo-400 font-medium">{session.user.email}</span> (SUPER_ADMIN)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Tenant Isolation: <strong className="text-emerald-400">Strict</strong></span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-semibold">Total Distributors</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalCount}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-semibold">Active Depots</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">{activeCount}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-semibold">Suspended</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-400">{suspendedCount}</p>
          </div>
        </div>

        {/* Distributors Management Table */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Distributor Accounts</h2>
            <span className="text-xs text-slate-400">{distributors.length} registered businesses</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/40 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="py-3.5 px-6">Distributor / Business</th>
                  <th className="py-3.5 px-6">Owner Contact</th>
                  <th className="py-3.5 px-6">Plan</th>
                  <th className="py-3.5 px-6">Users / Retailers</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {distributors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No distributor businesses registered yet.
                    </td>
                  </tr>
                ) : (
                  distributors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-white">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.address}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-slate-200">{d.ownerName}</p>
                        <p className="text-xs text-slate-400">{d.phone}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {d.subscriptionPlan}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {d.userCount} staff • {d.retailerCount} retailers
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            d.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : d.status === "SUSPENDED"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <AdminClientActions distributorId={d.id} currentStatus={d.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Recent Platform Audit Trail</h2>
            <span className="text-xs text-slate-400">Tamper-evident administrative history</span>
          </div>

          <div className="divide-y divide-slate-700/40">
            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm">
                No administrative actions logged yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 px-6 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-indigo-400">{log.action}</span>
                    <span className="text-slate-400"> on {log.targetType} ({log.distributorName}) by {log.adminEmail}</span>
                  </div>
                  <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
