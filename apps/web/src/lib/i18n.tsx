"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "bn" | "en";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  bn: {
    // Brand & App
    appName: "Distribo",
    tagline: "এফএমসিজি ও মুদি ডিস্ট্রিবিউটর ম্যানেজমেন্ট প্ল্যাটফর্ম",
    
    // Navigation Links
    navDashboard: "ড্যাশবোর্ড",
    navPOS: "ক্যাশ মেমো / পিওএস",
    navProducts: "পণ্য তালিকা (স্টক)",
    navInventory: "স্টক ইন / চালান",
    navRetailers: "দোকানদার ও রুট",
    navKhata: "বাকি খাতা (লেজার)",
    navClosing: "দৈনিক হিসাব-নিকাশ",
    navSettings: "সেটিংস ও স্টাফ",
    navAdmin: "সুপার অ্যাডমিন পোর্টাল",
    
    // Subtitles
    subDashboard: "দৈনিক ওভারভিউ ও রিয়েলটাইম সামারি",
    subPOS: "দ্রুত বিলিং ও থার্মাল রসিদ প্রিন্ট",
    subProducts: "কার্টন ও পিস হিসাব",
    subInventory: "কোম্পানি চালান ইনওয়ার্ড",
    subRetailers: "মুদির দোকানদার তালিকা",
    subKhata: "বকেয়া আদায় ও হিসাব",
    subClosing: "সন্ধ্যা ৭টার ক্যাশ ড্রয়ার হিসাব",
    subSettings: "ব্যবসা তথ্য ও কর্মচারী অ্যাক্সেস",

    // Roles
    roleOwner: "বিজনেস ওনার (মহাজন)",
    roleManager: "গোডাউন ম্যানেজার",
    roleSR: "ফিল্ড এসআর (ডেলিভারি)",
    roleSuperAdmin: "প্ল্যাটফর্ম সুপার অ্যাডমিন",

    // Quick Actions
    quickActionBtn: "দ্রুত কাজ",
    quickActionTitle: "কুইক অ্যাকশন ড্রয়ার",
    quickActionDesc: "যেকোনো স্ক্রিন থেকে এক ক্লিকে নতুন লেনদেন শুরু করুন",
    qaNewInvoice: "নতুন ক্যাশ মেমো (বিক্রি)",
    qaNewInvoiceDesc: "দোকানদার নির্বাচন করে ৩০ সেকেন্ডে বিল তৈরি করুন",
    qaCollectDue: "বকেয়া আদায় (টাকা জমা)",
    qaCollectDueDesc: "পুরোনো বাকি থেকে ক্যাশ বা বিকাশ গ্রহণ করুন",
    qaStockIn: "স্টক ইনওয়ার্ড (মাল রিসিভ)",
    qaStockInDesc: "কোম্পানির চালান অনুযায়ী নতুন কার্টন যুক্ত করুন",
    qaPettyExpense: "দৈনিক খরচ এন্ট্রি",
    qaPettyExpenseDesc: "চা, নাস্তা, লেবার ও ভ্যান ভাড়া খরচ লিখুন",
    qaAddRetailer: "নতুন দোকানদার যুক্ত করুন",
    qaAddRetailerDesc: "নতুন মুদির দোকানের নাম, ফোন ও বাকি লিমিট দিন",

    // Actions & Common
    logout: "লগআউট",
    active: "সক্রিয়",
    suspended: "স্থগিত",
    searchPlaceholder: "খুঁজুন (Search)...",
    close: "বন্ধ করুন",
  },
  en: {
    // Brand & App
    appName: "Distribo",
    tagline: "FMCG & Grocery Distributor Management Platform",
    
    // Navigation Links
    navDashboard: "Dashboard",
    navPOS: "POS Invoicing",
    navProducts: "Product Catalog",
    navInventory: "Stock Inward",
    navRetailers: "Retailers & Routes",
    navKhata: "Credit Ledger (Baki)",
    navClosing: "Daily Reconciliation",
    navSettings: "Settings & Staff",
    navAdmin: "Super Admin Portal",

    // Subtitles
    subDashboard: "Daily overview & real-time metrics",
    subPOS: "Rapid billing & thermal receipts",
    subProducts: "Carton & loose piece math",
    subInventory: "Supplier challan inward",
    subRetailers: "Grocery store directory",
    subKhata: "Outstanding dues & payments",
    subClosing: "Evening cash drawer hisab",
    subSettings: "Business info & staff access",

    // Roles
    roleOwner: "Business Owner",
    roleManager: "Godown Manager",
    roleSR: "Field Sales Rep",
    roleSuperAdmin: "Platform Super Admin",

    // Quick Actions
    quickActionBtn: "Quick Actions",
    quickActionTitle: "Quick Actions Drawer",
    quickActionDesc: "1-Click shortcuts from anywhere in your depot",
    qaNewInvoice: "New Cash Memo (Sale)",
    qaNewInvoiceDesc: "Select retailer and generate invoice in 30 seconds",
    qaCollectDue: "Collect Outstanding Due",
    qaCollectDueDesc: "Record cash or bKash against old credit balance",
    qaStockIn: "Stock Inward (Receive)",
    qaStockInDesc: "Receive new cartons from company truck",
    qaPettyExpense: "Log Petty Expense",
    qaPettyExpenseDesc: "Tea, labor, van fuel and depot expenses",
    qaAddRetailer: "Add New Retailer",
    qaAddRetailerDesc: "Register new grocery shop, phone & credit limit",

    // Actions & Common
    logout: "Log Out",
    active: "Active",
    suspended: "Suspended",
    searchPlaceholder: "Search...",
    close: "Close",
  },
};

const I18nContext = createContext<I18nContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("bn");

  useEffect(() => {
    const saved = localStorage.getItem("distribo_locale") as Locale | null;
    if (saved === "bn" || saved === "en") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("distribo_locale", newLocale);
  };

  const toggleLocale = () => {
    const next = locale === "bn" ? "en" : "bn";
    setLocale(next);
  };

  const t = (key: string): string => {
    return translations[locale][key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return ctx;
}
