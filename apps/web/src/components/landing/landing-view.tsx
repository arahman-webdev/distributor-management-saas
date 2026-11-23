"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { signOut } from "@distribo/auth/client";
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
  Languages,
  LogOut,
  LayoutDashboard,
  Shield,
  User,
} from "lucide-react";

interface LandingViewProps {
  user?: {
    id: string;
    name: string;
    email: string;
    distributorId?: string | null;
    distributorRole?: string | null;
    platformRole?: string | null;
  } | null;
}

export default function LandingView({ user }: LandingViewProps) {
  const { locale, toggleLocale } = useI18n();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  const isSuperAdmin = user?.platformRole === "SUPER_ADMIN";
  const dashboardLink = isSuperAdmin ? "/admin" : "/dashboard";
  const roleLabel = isSuperAdmin
    ? "SUPER_ADMIN"
    : user?.distributorRole || "MEMBER";

  // Content dictionary for Landing Page
  const content = {
    bn: {
      tagline: "ডিস্ট্রিবিউশন ম্যানেজমেন্ট প্ল্যাটফর্ম",
      navFeatures: "ফিচারসমূহ",
      navBenefits: "সুবিধাসমূহ",
      navPricing: "প্যাকেজ",
      navFAQ: "প্রশ্নোত্তর",
      signIn: "লগইন",
      freeTrial: "ফ্রি ট্রায়াল শুরু করুন",
      dashboard: "ড্যাশবোর্ড",
      logout: "লগআউট",
      badge: "বাংলাদেশের প্রথম নিবেদিত FMCG & Grocery ডিস্ট্রিবিউশন SaaS",
      heroTitlePrefix: "কাগজের মেমো আর বাকি খাতার দিন শেষ — ",
      heroTitleHighlight: "ডিস্ট্রিবিউশন ব্যবসা",
      heroTitleSuffix: " চালান ডিজিটাল গতিতে",
      heroDesc:
        "৩০ সেকেন্ডে থার্মাল ক্যাশ মেমো, কার্টন ও পিসের নির্ভুল হিসাব, ডিজিটাল বাকি খাতা এবং সন্ধ্যা ৭টার ক্যাশ ড্রয়ার ক্লোজিং।",
      ctaRegister: "নতুন এজেন্সি রেজিস্টার করুন",
      ctaDemo: "ডেমো অ্যাকাউন্টে ঢুকুন",
      ctaDashboard: "আপনার ড্যাশবোর্ডে যান",
      metrics: [
        { label: "বিলিং গতি", value: "< ৩০ সেকেন্ড", sub: "থার্মাল প্রিন্ট সহ" },
        { label: "ইউনিট হিসাব", value: "কার্টন ↔ পিস", sub: "অটোমেটিক কনভার্সন" },
        { label: "বাকি আদায়", value: "১০০% নির্ভুল", sub: "কাস্টমার খাতা লেজার" },
        { label: "দৈনিক হিসাব", value: "৫ মিনিটে", sub: "সন্ধ্যা ৭টার ক্যাশ ড্রয়ার" },
      ],
      brandTitle: "যেসব ব্র্যান্ডের ডিস্ট্রিবিউটরদের জন্য বিশেষভাবে নির্মিত",
      featuresTitle: "মূল কার্যকারিতা (Core Features)",
      featuresHeading: "ডিস্ট্রিবিউশন ডিপোর ৪টি মূল সমস্যার ১০০% স্থায়ী সমাধান",
      feature1Title: "১. ৩০ সেকেন্ডে থার্মাল পিওএস বিলিং",
      feature1Desc:
        "কীবোর্ডের ২ অক্ষর টাইপ করলেই দোকানদার ও প্রোডাক্ট চলে আসবে। কার্টন ও খুচরা পিস আলাদাভাবে এন্ট্রি করুন। এক ক্লিকে ৮০মিমি ব্লুটুথ/ইউএসবি থার্মাল রসিদ প্রিন্ট এবং হোয়াটসঅ্যাপ মেসেজ প্রস্তুত।",
      feature1Item1: "পূর্বের বকেয়া বাকি অটোমেটিক মেমোতে যোগ হবে",
      feature1Item2: "ক্যাশ, বিকাশ ও বাকির স্প্লিট পেমেন্ট সমর্থন",
      feature2Title: "২. কার্টন ও পিসের নির্ভুল হিসাব (Dual-UOM)",
      feature2Desc:
        "এফএমসিজি কোম্পানি চালান পাঠায় পেটি বা কার্টনে, আর দোকানদার কেনে ডজন বা পিসে। ডিস্ট্রিবিউটো স্বয়ংক্রিয়ভাবে কার্টনকে বেইজ পিসে রূপান্তর করে এবং ভগ্নাংশ পয়সার রাউন্ডিং হিসাব নিখুঁত রাখে।",
      feature2Item1: "কার্টন রেটের পাশাপাশি লুজ পিস ওভাররাইড রেট",
      feature2Item2: "স্টক শেষ হয়ে গেলে সতর্কতা অ্যালার্ট",
      feature3Title: "৩. ডিজিটাল বাকি খাতা ও কালেকশন",
      feature3Desc:
        "খাতা হারিয়ে যাওয়া বা এসআরের টাকা কালেকশন নিয়ে ঝামেলার দিন শেষ। প্রতি দোকানদারের জন্য টাইমস্ট্যাম্প সহ পূর্ণ খাতা লেজার। নতুন পণ্য না কিনেও পুরোনো বাকি জমা দিলে মানি রিসিট (MR) জেনারেট হয়।",
      feature3Item1: "দোকানদার বাকি লিমিট ক্রস করলে লাল সতর্কবার্তা",
      feature3Item2: "রুট ও মার্কেট অনুযায়ী বকেয়া তালিকা ফিল্টারিং",
      feature4Title: "৪. সন্ধ্যা ৭টার ক্লোজিং হিসাব-নিকাশ",
      feature4Desc:
        "সারাদিনের মোট বিক্রি, নগদ আদায়, পুরোনো বাকি আদায়, বিকাশ পেমেন্ট এবং গোডাউনের চা-নাস্তা বা ভ্যান ভাড়া খরচ একসাথে মিলিয়ে হিসাব দেবে কত টাকা ওনারের হাতে জমা হতে হবে।",
      feature4Item1: "ক্যাশ ড্রয়ার অটোমেটিক রিকনসিলিয়েশন",
      feature4Item2: "ক্লোজিং লক করার পর পেছনের ডেটা এডিট প্রতিরোধ",
      pricingTitle: "সহজ প্যাকেজ ও ফি (Pricing)",
      pricingHeading: "আপনার ডিস্ট্রিবিউশন ডিপোর পরিধি অনুযায়ী বেছে নিন",
      p1Tier: "ছোট ডিপো / সাব-ডিলার",
      p1Name: "স্টারটার (Starter)",
      p1Price: "৳১,৪৯৯",
      p1Duration: "/ মাস",
      p1Features: [
        "১টি গোডাউন / ডিপো",
        "২ জন ইউজার (মালিক + বিলার)",
        "সর্বোচ্চ ৩০০ দোকানদার",
        "থার্মাল প্রিন্টিং ও বাকি খাতা",
      ],
      p1Btn: "১৪ দিনের ফ্রি ট্রায়াল",
      p2Popular: "জনপ্রিয় পছন্দ (Most Popular)",
      p2Tier: "মাঝারি ডিস্ট্রিবিউটর",
      p2Name: "গ্রোথ (Growth)",
      p2Price: "৳২,৯৯৯",
      p2Duration: "/ মাস",
      p2Features: [
        "১টি প্রধান ডিপো",
        "৫ জন ইউজার (মালিক + ২ বিলার + ২ এসআর)",
        "সর্বোচ্চ ১,৫০০ দোকানদার",
        "রুট/বিট ম্যানেজমেন্ট ও ফিল্ড কালেকশন",
        "সন্ধ্যা ৭টার দৈনিক হিসাব রিকনসিলিয়েশন",
      ],
      p2Btn: "এখনই শুরু করুন",
      p3Tier: "বড় কর্পোরেট ডিলার",
      p3Name: "এন্টারপ্রাইজ (Enterprise)",
      p3Price: "কাস্টম",
      p3Features: [
        "মাল্টি-ডিপো ও মাল্টি-অঞ্চল",
        "আনলিমিটেড ইউজার ও এসআর",
        "ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার",
        "কাস্টম কোম্পানি ইআরপি ইন্টিগ্রেশন",
      ],
      p3Btn: "যোগাযোগ করুন",
      faqTitle: "সাধারণ প্রশ্নাবলী (FAQ)",
      faqHeading: "আপনার মনে কি কোনো প্রশ্ন আছে?",
      faq1Q: "থার্মাল প্রিন্টারে কীভাবে মেমো প্রিন্ট হবে?",
      faq1A:
        "যেকোনো ৮০ মিমি বা ৫৮ মিমি ব্লুটুথ ও ইউএসবি পিওএস থার্মাল প্রিন্টারে সরাসরি ব্রাউজার থেকে কোনো অতিরিক্ত ড্রাইভার ছাড়াই এক ক্লিকে স্পষ্ট মেমো প্রিন্ট হয়।",
      faq2Q: "আমার পুরোনো খাতার বাকি কীভাবে সফটওয়্যারে তুলবো?",
      faq2A:
        "এক্সেল (Excel/CSV) ফাইল দিয়ে এক ক্লিকে আপনার সমস্ত দোকানদারের নাম, মোবাইল ও পূর্বের বাকি ব্যালেন্স আপলোড করে নিতে পারবেন মাত্র ৫ মিনিটে।",
      faq3Q: "কম্পিউটার অপারেটর বা ম্যানেজার কি মালিকের প্রফিট দেখতে পারবে?",
      faq3A:
        "না। আমাদের রোল-বেসড এক্সেস কন্ট্রোলে (RBAC) ম্যানেজার ও এসআরদের জন্য পণ্যের ক্রয়মূল্য ও মোট প্রফিট মার্জিন সম্পূর্ণ গোপন রাখার অপশন রয়েছে।",
      footerDesc: "বাংলাদেশের প্রথম নিবেদিত FMCG ও গ্রোসারি ডিস্ট্রিবিউটর ম্যানেজমেন্ট SaaS প্ল্যাটফর্ম।",
      support: "সাপোর্ট:",
      copyright: "সর্বস্বত্ব সংরক্ষিত।",
    },
    en: {
      tagline: "Distribution Management Platform",
      navFeatures: "Features",
      navBenefits: "Benefits",
      navPricing: "Pricing",
      navFAQ: "FAQ",
      signIn: "Sign In",
      freeTrial: "Start Free Trial",
      dashboard: "Dashboard",
      logout: "Log Out",
      badge: "Bangladesh's 1st Purpose-Built FMCG & Grocery Distribution SaaS",
      heroTitlePrefix: "Say Goodbye to Paper Memos & Lost Khata Books — ",
      heroTitleHighlight: "FMCG Distribution",
      heroTitleSuffix: " at Digital Speed",
      heroDesc:
        "30-second thermal cash memos, seamless carton ↔ piece math, automated credit khata, and evening 7 PM cash drawer reconciliation.",
      ctaRegister: "Register New Depot",
      ctaDemo: "Try Demo Account",
      ctaDashboard: "Open Your Dashboard",
      metrics: [
        { label: "Billing Speed", value: "< 30 Seconds", sub: "With thermal print" },
        { label: "Dual Units", value: "Carton ↔ Piece", sub: "Auto math conversion" },
        { label: "Dues Recovery", value: "100% Accurate", sub: "Customer ledger" },
        { label: "Daily Closing", value: "In 5 Minutes", sub: "7 PM cash drawer" },
      ],
      brandTitle: "Built for Distributors of Leading Brands",
      featuresTitle: "Core Features",
      featuresHeading: "Permanent 100% Solutions for the 4 Biggest Depot Challenges",
      feature1Title: "1. 30-Second Thermal POS Billing",
      feature1Desc:
        "Type just 2 keystrokes to pull up retailer and product instantly. Enter cartons and loose pieces separately with one-click 80mm Bluetooth/USB thermal printing and WhatsApp receipts.",
      feature1Item1: "Previous unpaid balance automatically appended to memo",
      feature1Item2: "Supports Split payments (Cash, bKash, and Baki credit)",
      feature2Title: "2. Dual-UOM (Carton ↔ Loose Piece Math)",
      feature2Desc:
        "FMCG principals invoice in cartons/crates, while retailers buy in dozens or single pieces. Distribo handles conversions seamlessly down to fractional half-up paisa accuracy.",
      feature2Item1: "Independent piece override rates alongside carton rate",
      feature2Item2: "Real-time low stock depletion warnings",
      feature3Title: "3. Digital Credit Khata & Collections",
      feature3Desc:
        "Never lose a page or dispute SR field collections again. Complete timestamped ledgers for every retailer with automated Money Receipts (MR) for standalone credit collections.",
      feature3Item1: "Instant red warning when retailer exceeds credit limit",
      feature3Item2: "Filter dues by field route, market, or salesman",
      feature4Title: "4. Evening 7 PM Cash Reconciliation",
      feature4Desc:
        "Total daytime sales, cash receipts, past credit collected, MFS transfers, and warehouse petty expenses balanced together to tell the owner exactly how much cash belongs in the drawer.",
      feature4Item1: "Automatic cash drawer variance reconciliation",
      feature4Item2: "Closing lock protects against historical backdating",
      pricingTitle: "Pricing Plans",
      pricingHeading: "Choose the Plan That Fits Your Depot Operations",
      p1Tier: "Small Depot / Sub-Dealer",
      p1Name: "Starter",
      p1Price: "৳1,499",
      p1Duration: "/ month",
      p1Features: [
        "1 Godown / Depot",
        "2 Users (Owner + Biller)",
        "Up to 300 Retailers",
        "Thermal Printing & Credit Khata",
      ],
      p1Btn: "14-Day Free Trial",
      p2Popular: "Most Popular",
      p2Tier: "Growing Distributor",
      p2Name: "Growth",
      p2Price: "৳2,999",
      p2Duration: "/ month",
      p2Features: [
        "1 Main Depot",
        "5 Users (Owner + 2 Billers + 2 SRs)",
        "Up to 1,500 Retailers",
        "Beat & Route Management with Field Collection",
        "Evening 7 PM Daily Reconciliation",
      ],
      p2Btn: "Get Started Now",
      p3Tier: "Large Corporate Agency",
      p3Name: "Enterprise",
      p3Price: "Custom",
      p3Features: [
        "Multi-Depot & Multi-Territory",
        "Unlimited Users & SR Field Teams",
        "Dedicated Account Manager",
        "Custom ERP Principal Integration",
      ],
      p3Btn: "Contact Sales",
      faqTitle: "Frequently Asked Questions",
      faqHeading: "Got Questions? We Have Answers.",
      faq1Q: "How does thermal printing work without special software?",
      faq1A:
        "Distribo directly prints crisp receipts on standard 80mm or 58mm Bluetooth/USB thermal POS printers right from the web browser without any printer driver installation.",
      faq2Q: "Can I import my existing customer baki from paper notebooks?",
      faq2A:
        "Yes! You can bulk import all your retailer names, phone numbers, and opening credit balances using a simple Excel/CSV file in under 5 minutes.",
      faq3Q: "Can computer operators or billers see the owner's profit margins?",
      faq3A:
        "No. Our strict Role-Based Access Control (RBAC) ensures purchase costs and owner profit margins are hidden from billers, managers, and salesmen.",
      footerDesc: "Bangladesh's 1st dedicated SaaS ERP for FMCG & Grocery Distributors.",
      support: "Support:",
      copyright: "All rights reserved.",
    },
  };

  const t = content[locale];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Sticky Public Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold shadow-md shadow-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-slate-900 leading-tight">
                  Distribo
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  FMCG
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                {t.tagline}
              </span>
            </div>
          </div>

          {/* Nav Anchors */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">
              {t.navFeatures}
            </a>
            <a href="#solutions" className="hover:text-emerald-600 transition-colors">
              {t.navBenefits}
            </a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">
              {t.navPricing}
            </a>
            <a href="#faq" className="hover:text-emerald-600 transition-colors">
              {t.navFAQ}
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Language Switcher Button */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-colors bg-white hover:bg-slate-50 shadow-2xs"
              title={locale === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
            >
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <span>{locale === "bn" ? "ENG" : "বাংলা"}</span>
            </button>

            {/* Authenticated State */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* User Pill with Link to Dashboard */}
                <Link
                  href={dashboardLink}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span className="max-w-[120px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-200/60 text-emerald-900 border border-emerald-300">
                    {roleLabel}
                  </span>
                </Link>

                {/* Prominent Landing Page Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-bold transition-all shadow-2xs hover:border-red-300 disabled:opacity-50"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {loggingOut
                      ? locale === "bn"
                        ? "লগআউট হচ্ছে..."
                        : "Logging out..."
                      : t.logout}
                  </span>
                </button>
              </div>
            ) : (
              /* Guest State: Sign In & Register */
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {t.signIn}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all shadow-emerald-900/20"
                >
                  {t.freeTrial}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {t.badge}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
            {t.heroTitlePrefix}
            <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-8">
              {t.heroTitleHighlight}
            </span>
            {t.heroTitleSuffix}
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                href={dashboardLink}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>{t.ctaDashboard}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>{t.ctaRegister}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>{t.ctaDemo}</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Metrics Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            {t.metrics.map((metric, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-400 block uppercase">
                  {metric.label}
                </span>
                <strong className="text-xl sm:text-2xl font-black text-slate-900">
                  {metric.value}
                </strong>
                <p className="text-[11px] text-slate-500 mt-0.5">{metric.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Ecosystem */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            {t.brandTitle}
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
              {t.featuresTitle}
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t.featuresHeading}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                {t.feature1Title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {t.feature1Desc}
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {t.feature1Item1}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {t.feature1Item2}
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                {t.feature2Title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {t.feature2Desc}
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  {t.feature2Item1}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  {t.feature2Item2}
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                {t.feature3Title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {t.feature3Desc}
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  {t.feature3Item1}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  {t.feature3Item2}
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">
                {t.feature4Title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {t.feature4Desc}
              </p>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  {t.feature4Item1}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  {t.feature4Item2}
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
              {t.pricingTitle}
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t.pricingHeading}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  {t.p1Tier}
                </span>
                <h4 className="text-xl font-bold text-slate-900">{t.p1Name}</h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">{t.p1Price}</span>
                  <span className="text-xs text-slate-500">{t.p1Duration}</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  {t.p1Features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-xs text-center text-slate-800 transition-colors block"
              >
                {t.p1Btn}
              </Link>
            </div>

            {/* Growth */}
            <div className="bg-emerald-950 text-white rounded-2xl border-2 border-emerald-500 p-8 flex flex-col justify-between relative shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                {t.p2Popular}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  {t.p2Tier}
                </span>
                <h4 className="text-xl font-bold text-white">{t.p2Name}</h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-400">{t.p2Price}</span>
                  <span className="text-xs text-slate-400">{t.p2Duration}</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  {t.p2Features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-xs text-center text-slate-950 transition-colors block"
              >
                {t.p2Btn}
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  {t.p3Tier}
                </span>
                <h4 className="text-xl font-bold text-slate-900">{t.p3Name}</h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{t.p3Price}</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600">
                  {t.p3Features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="mailto:support@distribo.app"
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-xs text-center text-slate-800 transition-colors block"
              >
                {t.p3Btn}
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
              {t.faqTitle}
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t.faqHeading}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {t.faq1Q}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-6">
                {t.faq1A}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {t.faq2Q}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-6">
                {t.faq2A}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {t.faq3Q}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed pl-6">
                {t.faq3A}
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
              <p className="text-[11px] text-slate-500">{t.footerDesc}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">
              {t.signIn}
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              {t.freeTrial}
            </Link>
            <span className="text-slate-600">|</span>
            <span>
              {t.support} support@distribo.app
            </span>
          </div>

          <p className="text-slate-500">
            © {new Date().getFullYear()} Distribo. {t.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}
