"use client";

import { useState } from "react";
import { signIn } from "@distribo/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, AlertCircle, ArrowRight, Store } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        setError(res.error.message || "ইমেইল বা পাসওয়ার্ড সঠিক নয় (Invalid email or password)");
        setLoading(false);
        return;
      }

      // Check user role from returned user data
      const user = res.data?.user as any;
      if (user?.platformRole === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "লগইন ব্যর্থ হয়েছে (Login failed)");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1C398E]/10 text-[#1C398E] mb-3 shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Distribo (ডিস্ট্রিবিউটো)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            মালিক, ম্যানেজার বা এসআর অ্যাকাউন্টে লগইন করুন
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              ইমেইল (Email Address)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@distribo.app"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C398E] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C398E] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 shadow-md shadow-[#1C398E]/25 hover:scale-101"
          >
            {loading ? "যাচাই করা হচ্ছে..." : "লগইন করুন (Sign In)"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            নতুন ডিস্ট্রিবিউটর? (New distributor?){" "}
            <Link
              href="/register"
              className="text-[#1C398E] font-bold hover:underline"
            >
              এজেন্সি রেজিস্টার করুন (Register business)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
