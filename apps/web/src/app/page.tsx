import Link from "next/link";
import {
  Store,
  ShoppingCart,
  Package,
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Receipt,
  Smartphone,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Sticky Public Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-900/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight block">
                Distribo
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                ডিস্ট্রিবিউশন ম্যানেজমেন্ট প্ল্যাটফর্ম
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">
              ফিচারসমূহ (Features)
            </a>
            <a href="#solutions" className="hover:text-emerald-600 transition-colors">
              সুবিধাসমূহ (Benefits)
            </a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">
              প্যাকেজ (Pricing)
            </a>
            <a href="#faq" className="hover:text-emerald-600 transition-colors">
              প্রশ্নোত্তর (FAQ)
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              লগইন (Sign In)
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all shadow-emerald-900/20"
            >
              ফ্রি ট্রায়াল শুরু করুন
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            বাংলাদেশের প্রথম নিবেদিত FMCG & Grocery ডিস্ট্রিবিউশন SaaS
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
            কাগজের মেমো আর বাকি খাতার দিন শেষ —{" "}
            <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-8">
              ডিস্ট্রিবিউশন ব্যবসা
            </span>{" "}
            চালান ডিজিটাল গতিতে
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ৩০ সেকেন্ডে থার্মাল ক্যাশ মেমো, কার্টন ও পিসের নির্ভুল হিসাব, ডিজিটাল বাকি খাতা এবং সন্ধ্যা ৭টার ক্যাশ ড্রয়ার ক্লোজিং।
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>নতুন এজেন্সি রেজিস্টার করুন</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>ডেমো অ্যাকাউন্টে ঢুকুন</span>
            </Link>
          </div>

          {/* Quick Metrics Badge */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block uppercase">বিলিং গতি</span>
              <strong className="text-xl sm:text-2xl font-black text-emerald-600">&lt; ৩০ সেকেন্ড</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">থার্মাল প্রিন্ট সহ</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block uppercase">ইউনিট হিসাব</span>
              <strong className="text-xl sm:text-2xl font-black text-slate-900">কার্টন ↔ পিস</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">অটোমেটিক কনভার্সন</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block uppercase">বাকি আদায়</span>
              <strong className="text-xl sm:text-2xl font-black text-blue-600">১০০% নির্ভুল</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">কাস্টমার খাতা লেজার</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-400 block uppercase">দৈনিক হিসাব</span>
              <strong className="text-xl sm:text-2xl font-black text-purple-600">৫ মিনিটে</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">সন্ধ্যা ৭টার ক্যাশ ড্রয়ার</p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Ecosystem */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            যেসব ব্র্যান্ডের ডিস্ট্রিবিউটরদের জন্য বিশেষভাবে নির্মিত
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-black text-slate-500">
            <span className="hover:text-slate-800 transition-colors">UNILEVER</span>
            <span>•</span>
            <span className="hover:text-slate-800 transition-colors">PRAN-RFL</span>
            <span>•</span>
            <span className="hover:text-slate-800 transition-colors">SQUARE TOILETRIES</span>
            <span>•</span>
            <span className="hover:text-slate-800 transition-colors">MEGHNA / FRESH</span>
            <span>•</span>
            <span className="hover:text-slate-800 transition-colors">AKIJ FOODS</span>
            <span>•</span>
            <span className="hover:text-slate-800 transition-colors">ACI CONSUMER</span>
            <span>•</span>
            <span className="hover:text-slate-800 transition-colors">LOCAL GROCERY MILLS</span>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars (Features) */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              মূল কার্যকারিতা (Core Features)
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              ডিস্ট্রিবিউশন ডিপোর ৪টি মূল সমস্যার ১০০% স্থায়ী সমাধান
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                ১. ৩০ সেকেন্ডে থার্মাল পিওএস বিলিং
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                কীবোর্ডের ২ অক্ষর টাইপ করলেই দোকানদার ও প্রোডাক্ট চলে আসবে। কার্টন ও খুচরা পিস আলাদাভাবে এন্ট্রি করুন। এক ক্লিকে ৮০মিমি ব্লুটুথ/ইউএসবি থার্মাল রসিদ প্রিন্ট এবং হোয়াটসঅ্যাপ মেসেজ প্রস্তুত।
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  পূর্বের বকেয়া বাকি অটোমেটিক মেমোতে যোগ হবে
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ক্যাশ, বিকাশ ও বাকির স্প্লিট পেমেন্ট সমর্থন
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                ২. কার্টন ও পিসের নির্ভুল হিসাব (Dual-UOM)
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                এফএমসিজি কোম্পানি চালান পাঠায় পেটি বা কার্টনে, আর দোকানদার কেনে ডজন বা পিসে। ডিস্ট্রিবিউটো স্বয়ংক্রিয়ভাবে কার্টনকে বেইজ পিসে রূপান্তর করে এবং ভগ্নাংশ পয়সার রাউন্ডিং হিসাব নিখুঁত রাখে।
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  কার্টন রেটের পাশাপাশি লুজ পিস ওভাররাইড রেট
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  স্টক শেষ হয়ে গেলে সতর্কতা অ্যালার্ট
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                ৩. ডিজিটাল বাকি খাতা ও কালেকশন
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                খাতা হারিয়ে যাওয়া বা এসআরের টাকা কালেকশন নিয়ে ঝামেলার দিন শেষ। প্রতি দোকানদারের জন্য টাইমস্ট্যাম্প সহ পূর্ণ খাতা লেজার। নতুন পণ্য না কিনেও পুরোনো বাকি জমা দিলে মানি রিসিট (MR) জেনারেট হয়।
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  দোকানদার বাকি লিমিট ক্রস করলে লাল সতর্কবার্তা
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  রুট ও মার্কেট অনুযায়ী বকেয়া তালিকা ফিল্টারিং
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                ৪. সন্ধ্যা ৭টার ক্লোজিং হিসাব-নিকাশ
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                সারাদিনের মোট বিক্রি, নগদ আদায়, পুরোনো বাকি আদায়, বিকাশ পেমেন্ট এবং গোডাউনের চা-নাস্তা বা ভ্যান ভাড়া খরচ একসাথে মিলিয়ে হিসাব দেবে কত টাকা ওনারের হাতে জমা হতে হবে।
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  ক্যাশ ড্রয়ার অটোমেটিক রিকনসিলিয়েশন
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  ক্লোজিং লক করার পর পেছনের ডেটা এডিট প্রতিরোধ
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              সহজ প্যাকেজ ও ফি (Pricing)
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              আপনার ডিস্ট্রিবিউশন ডিপোর পরিধি অনুযায়ী বেছে নিন
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  ছোট ডিপো / সাব-ডিলার
                </span>
                <h4 className="text-xl font-bold text-slate-900">স্টারটার (Starter)</h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">৳১,৪৯৯</span>
                  <span className="text-xs text-slate-500">/ মাস</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ১টি গোডাউন / ডিপো
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ২ জন ইউজার (মালিক + বিলার)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    সর্বোচ্চ ৩০০ দোকানদার
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    থার্মাল প্রিন্টিং ও বাকি খাতা
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-xs text-center text-slate-800 transition-colors block"
              >
                ১৪ দিনের ফ্রি ট্রায়াল
              </Link>
            </div>

            {/* Growth */}
            <div className="bg-emerald-950 text-white rounded-2xl border-2 border-emerald-500 p-8 flex flex-col justify-between relative shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                জনপ্রিয় পছন্দ (Most Popular)
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  মাঝারি ডিস্ট্রিবিউটর
                </span>
                <h4 className="text-xl font-bold text-white">গ্রোথ (Growth)</h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-400">৳২,৯৯৯</span>
                  <span className="text-xs text-slate-400">/ মাস</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ১টি প্রধান ডিপো
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ৫ জন ইউজার (মালিক + ২ বিলার + ২ এসআর)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    সর্বোচ্চ ১,৫০০ দোকানদার
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    রুট/বিট ম্যানেজমেন্ট ও ফিল্ড কালেকশন
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    সন্ধ্যা ৭টার দৈনিক হিসাব রিকনসিলিয়েশন
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-center text-slate-950 transition-colors block"
              >
                এখনই শুরু করুন
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  বড় কর্পোরেট ডিলার
                </span>
                <h4 className="text-xl font-bold text-slate-900">এন্টারপ্রাইজ (Enterprise)</h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">কাস্টম</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    মাল্টি-ডিপো ও মাল্টি-অঞ্চল
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    আনলিমিটেড ইউজার ও এসআর
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    কাস্টম কোম্পানি ইআরপি ইন্টিগ্রেশন
                  </li>
                </ul>
              </div>
              <a
                href="mailto:support@distribo.app"
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-xs text-center text-slate-800 transition-colors block"
              >
                যোগাযোগ করুন
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              সাধারণ প্রশ্নাবলী (FAQ)
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              আপনার মনে কি কোনো প্রশ্ন আছে?
            </h3>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                থার্মাল প্রিন্টারে কীভাবে মেমো প্রিন্ট হবে?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-6">
                যেকোনো ৮০ মিমি বা ৫৮ মিমি ব্লুটুথ ও ইউএসবি পিওএস থার্মাল প্রিন্টারে সরাসরি ব্রাউজার থেকে কোনো অতিরিক্ত ড্রাইভার ছাড়াই এক ক্লিকে স্পষ্ট মেমো প্রিন্ট হয়।
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                আমার পুরোনো খাতার বাকি কীভাবে সফটওয়্যারে তুলবো?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-6">
                এক্সেল (Excel/CSV) ফাইল দিয়ে এক ক্লিকে আপনার সমস্ত দোকানদারের নাম, মোবাইল ও পূর্বের বাকি ব্যালেন্স আপলোড করে নিতে পারবেন মাত্র ৫ মিনিটে।
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                কম্পিউটার অপারেটর বা ম্যানেজার কি মালিকের প্রফিট দেখতে পারবে?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-6">
                না। আমাদের রোল-বেসড এক্সেস কন্ট্রোলে (RBAC) ম্যানেজার ও এসআরদের জন্য পণ্যের ক্রয়মূল্য ও মোট প্রফিট মার্জিন সম্পূর্ণ গোপন রাখার অপশন রয়েছে।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Distribo</span>
              <p className="text-[11px] text-slate-500">
                FMCG & Grocery Distributor Management SaaS in Bangladesh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">
              লগইন
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              রেজিস্ট্রেশন
            </Link>
            <span className="text-slate-600">|</span>
            <span>সাপোর্ট: support@distribo.app</span>
          </div>

          <p className="text-slate-500">
            © {new Date().getFullYear()} Distribo. সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </footer>
    </div>
  );
}
