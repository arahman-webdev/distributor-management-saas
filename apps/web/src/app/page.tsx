export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Day 1 Architecture Verified
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          Distribo (ডিস্ট্রিবিউটো)
        </h1>
        <p className="text-slate-600 mb-6">
          Bangladeshi FMCG & Grocery Distributor Management SaaS
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Architecture
            </span>
            <p className="text-sm font-medium text-slate-800">
              pnpm Monorepo
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Database
            </span>
            <p className="text-sm font-medium text-slate-800">
              PostgreSQL + Prisma
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Authentication
            </span>
            <p className="text-sm font-medium text-slate-800">
              Better Auth (Email/Pass)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
          <span>Dual-UOM Math Engine: Active</span>
          <span>•</span>
          <span>Exact Decimal Rounding: Verified</span>
          <span>•</span>
          <span>CI/CD Pipeline: Ready</span>
        </div>
      </div>
    </main>
  );
}
