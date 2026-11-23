"use client";

import { useState, useTransition, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  POSProductItem,
  POSRetailerItem,
  POSInitData,
  CompletedThermalInvoice,
  createInvoiceAction,
} from "@/lib/actions/pos-actions";
import ThermalCashMemo from "@/components/pos/thermal-cash-memo";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Store,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  MapPin,
  RefreshCw,
  Wallet,
  Receipt,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from "lucide-react";
import {
  roundCurrency,
  toTotalPieces,
  toCartonPieceBreakdown,
  calculateLineItemTotal,
  validateSplitPayment,
  calculateCreditUtilization,
} from "@/lib/calculations";

interface POSBillingViewProps {
  initData: POSInitData;
}

interface CartItem {
  product: POSProductItem;
  cartonQty: number;
  pieceQty: number;
}

const MFS_PROVIDERS = [
  { id: "bKash", name: "বিকাশ (bKash)", color: "text-pink-600 bg-pink-50 border-pink-200" },
  { id: "Nagad", name: "নগদ (Nagad)", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { id: "Rocket", name: "রকেট (Rocket)", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "Bank", name: "ব্যাংক ট্রান্সফার (Bank)", color: "text-blue-600 bg-blue-50 border-blue-200" },
];

export default function POSBillingView({ initData }: POSBillingViewProps) {
  const { locale } = useI18n();
  const isBn = locale === "bn";
  const [isPending, startTransition] = useTransition();

  const { products, retailers, userRole, userName, distributorName } = initData;

  // Selected Retailer
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(
    retailers[0]?.id || ""
  );

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payment Breakdown States
  const [discountInput, setDiscountInput] = useState<string>("0");
  const [cashPaidInput, setCashPaidInput] = useState<string>("0");
  const [mfsPaidInput, setMfsPaidInput] = useState<string>("0");
  const [mfsProvider, setMfsProvider] = useState<string>("bKash");

  // Filter States
  const [searchProductTerm, setSearchProductTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchRetailerTerm, setSearchRetailerTerm] = useState("");

  // Notification & Thermal Modal States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [completedInvoice, setCompletedInvoice] =
    useState<CompletedThermalInvoice | null>(null);

  // Get active selected retailer object
  const activeRetailer = useMemo(() => {
    return retailers.find((r) => r.id === selectedRetailerId) || null;
  }, [retailers, selectedRetailerId]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products for quick picking
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchProductTerm.trim() === "" ||
        p.name.toLowerCase().includes(searchProductTerm.toLowerCase()) ||
        (p.banglaName && p.banglaName.toLowerCase().includes(searchProductTerm.toLowerCase())) ||
        p.brand.toLowerCase().includes(searchProductTerm.toLowerCase());

      const matchCat =
        selectedCategory === "ALL" || p.category === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [products, searchProductTerm, selectedCategory]);

  // Filtered Retailers for dropdown
  const filteredRetailers = useMemo(() => {
    if (!searchRetailerTerm.trim()) return retailers;
    const term = searchRetailerTerm.toLowerCase();
    return retailers.filter(
      (r) =>
        r.shopName.toLowerCase().includes(term) ||
        r.phone.includes(term) ||
        (r.ownerName && r.ownerName.toLowerCase().includes(term))
    );
  }, [retailers, searchRetailerTerm]);

  // Cart Calculations
  const { subtotal, totalCartons, totalPiecesCount, calculatedItems } = useMemo(() => {
    let sub = 0;
    let ctnCount = 0;
    let pcsCount = 0;

    const items = cart.map((item) => {
      const lineCalc = calculateLineItemTotal(
        item.cartonQty,
        item.pieceQty,
        item.product.conversionFactor,
        item.product.wholesalePrice,
        item.product.wholesalePiecePrice || undefined
      );

      sub += lineCalc.totalPrice;
      ctnCount += item.cartonQty;
      pcsCount += item.pieceQty;

      return {
        ...item,
        lineTotal: lineCalc.totalPrice,
        unitPiecePrice: lineCalc.unitPricePerPiece,
        totalPieces: lineCalc.totalPieces,
      };
    });

    return {
      subtotal: roundCurrency(sub),
      totalCartons: ctnCount,
      totalPiecesCount: pcsCount,
      calculatedItems: items,
    };
  }, [cart]);

  // Financial summary
  const discount = Math.max(0, roundCurrency(parseFloat(discountInput) || 0));
  const currentBill = Math.max(0, roundCurrency(subtotal - discount));
  const previousDue = activeRetailer ? roundCurrency(activeRetailer.currentDue) : 0;
  const grandTotal = roundCurrency(currentBill + previousDue);

  const cashPaid = Math.max(0, roundCurrency(parseFloat(cashPaidInput) || 0));
  const mfsPaid = Math.max(0, roundCurrency(parseFloat(mfsPaidInput) || 0));
  const totalPaid = roundCurrency(cashPaid + mfsPaid);
  const remainingDue = roundCurrency(grandTotal - totalPaid);

  const retailerCreditLimit = activeRetailer ? activeRetailer.creditLimit : 0;
  const isOverCreditLimit =
    retailerCreditLimit > 0 && remainingDue > retailerCreditLimit;
  const creditUtilization = calculateCreditUtilization(
    remainingDue,
    retailerCreditLimit
  );

  // Cart Handlers
  const handleAddToCart = (product: POSProductItem) => {
    setErrorMsg(null);
    if (product.currentStockPieces <= 0) {
      setErrorMsg(`"${product.name}" এর স্টক শেষ (স্টক: ০ পিস)।`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newCartonQty = existing.cartonQty + 1;
        const requestedPieces = toTotalPieces(
          newCartonQty,
          existing.pieceQty,
          product.conversionFactor
        );

        if (requestedPieces > product.currentStockPieces) {
          setErrorMsg(
            `"${product.name}" এর পর্যাপ্ত স্টক নেই (মজুদ: ${product.currentStockPieces} পিস)।`
          );
          return prev;
        }

        return prev.map((i) =>
          i.product.id === product.id ? { ...i, cartonQty: newCartonQty } : i
        );
      } else {
        // If stock is less than 1 carton, add as loose pieces
        const initialCarton = product.currentStockPieces >= product.conversionFactor ? 1 : 0;
        const initialPiece = initialCarton === 0 ? 1 : 0;

        return [
          ...prev,
          {
            product,
            cartonQty: initialCarton,
            pieceQty: initialPiece,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (
    productId: string,
    cartonQty: number,
    pieceQty: number
  ) => {
    setErrorMsg(null);
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const safeCtn = Math.max(0, Math.floor(cartonQty));
    const safePcs = Math.max(0, Math.floor(pieceQty));
    const totalPieces = toTotalPieces(safeCtn, safePcs, item.product.conversionFactor);

    if (totalPieces === 0) {
      handleRemoveItem(productId);
      return;
    }

    if (totalPieces > item.product.currentStockPieces) {
      setErrorMsg(
        `"${item.product.name}" এর পর্যাপ্ত স্টক নেই! বর্তমানে মজুদ: ${item.product.currentStockPieces} পিস।`
      );
      return;
    }

    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, cartonQty: safeCtn, pieceQty: safePcs }
          : i
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountInput("0");
    setCashPaidInput("0");
    setMfsPaidInput("0");
    setErrorMsg(null);
  };

  // Quick Payment Shortcuts
  const setExactFullCash = () => {
    setCashPaidInput(String(grandTotal));
    setMfsPaidInput("0");
  };

  const setCurrentBillCash = () => {
    setCashPaidInput(String(currentBill));
    setMfsPaidInput("0");
  };

  const setExactbKash = () => {
    setMfsPaidInput(String(grandTotal));
    setCashPaidInput("0");
    setMfsProvider("bKash");
  };

  const setFullCreditBaki = () => {
    setCashPaidInput("0");
    setMfsPaidInput("0");
  };

  // Submit Invoice
  const handleConfirmInvoice = () => {
    setErrorMsg(null);

    if (!selectedRetailerId) {
      setErrorMsg("অনুগ্রহ করে দোকানদার নির্বাচন করুন।");
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("ইনভয়েসে কমপক্ষে একটি পণ্য যুক্ত করুন।");
      return;
    }

    startTransition(async () => {
      const res = await createInvoiceAction({
        retailerId: selectedRetailerId,
        items: cart.map((i) => ({
          productId: i.product.id,
          cartonQty: i.cartonQty,
          pieceQty: i.pieceQty,
        })),
        discount,
        cashPaid,
        mfsPaid,
        mfsProvider: mfsPaid > 0 ? mfsProvider : undefined,
      });

      if (res.success && res.invoice) {
        setCompletedInvoice(res.invoice);
        setSuccessMsg(
          `ক্যাশ মেমো #${res.invoice.invoiceNumber} সফলভাবে তৈরি হয়েছে!`
        );
        // Reset inputs
        handleClearCart();
      } else {
        setErrorMsg(res.error || "ক্যাশ মেমো তৈরি করতে ব্যর্থ হয়েছে।");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && !completedInvoice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* POS Top Bar */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C398E] text-white flex items-center justify-center font-bold shadow-sm shadow-[#1C398E]/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                {isBn ? "ক্যাশ মেমো ও দ্রুত পিওএস বিলিং" : "Fast POS Billing Terminal"}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1C398E]/10 text-[#1C398E] border border-[#1C398E]/20">
                {userRole === "SR" ? (isBn ? "এসআর বিলিং" : "SR Mode") : (isBn ? "ডিপো কাউন্টার" : "Depot Mode")}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {distributorName} • {isBn ? "বিক্রয়কারী:" : "Billing User:"} <strong>{userName}</strong>
            </p>
          </div>
        </div>

        {/* Quick Cart Status Pill */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "আইটেম সংখ্যা" : "Cart Items"}
            </p>
            <p className="text-xs font-bold text-slate-800">
              {cart.length} {isBn ? "আইটেম" : "items"} ({totalCartons}C {totalPiecesCount}P)
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-all flex items-center gap-1"
              title="কার্ট খালি করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isBn ? "রিসেট" : "Reset"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Retailer Picker, Product Catalog & Cart (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section 1: Retailer Selection */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#1C398E]" />
                <span>{isBn ? "দোকানদার নির্বাচন করুন (Select Retailer) *" : "Select Retailer *"}</span>
              </label>
              {activeRetailer && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {isBn ? "মোট বরাদ্দ দোকান:" : "Assigned Stores:"} <strong>{retailers.length}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isBn ? "দোকান বা ফোন দিয়ে খুঁজুন..." : "Filter stores..."}
                  value={searchRetailerTerm}
                  onChange={(e) => setSearchRetailerTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1C398E]"
                />
              </div>

              <select
                value={selectedRetailerId}
                onChange={(e) => setSelectedRetailerId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 font-bold text-slate-800"
              >
                {filteredRetailers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.shopName} {r.beatName ? `(${r.beatName})` : ""} - বাকি: ৳{r.currentDue.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Retailer Snapshot Banner */}
            {activeRetailer && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 text-sm">
                    {activeRetailer.shopName}
                  </p>
                  <p className="text-slate-500 text-[11px] flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {activeRetailer.phone}
                    </span>
                    {activeRetailer.beatName && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {activeRetailer.beatName}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">
                      {isBn ? "পূর্বের বাকি" : "Previous Due"}
                    </p>
                    <p className="font-black text-amber-600 text-sm">
                      ৳ {activeRetailer.currentDue.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">
                      {isBn ? "বাকি লিমিট" : "Credit Limit"}
                    </p>
                    <p className="font-bold text-slate-700 text-sm">
                      ৳ {activeRetailer.creditLimit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Product Picker (Quick Tap Catalog) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    isBn
                      ? "পণ্য খুঁজুন (নাম, ব্র্যান্ড বা ক্যাটাগরি)..."
                      : "Search product by name, brand..."
                  }
                  value={searchProductTerm}
                  onChange={(e) => setSearchProductTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-all ${
                    selectedCategory === "ALL"
                      ? "bg-[#1C398E] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {isBn ? "সকল" : "All"}
                </button>
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-all ${
                      selectedCategory === cat
                        ? "bg-[#1C398E] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Fast Product Tap Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-6 text-center text-slate-400 text-xs">
                  {isBn ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.currentStockPieces <= 0;
                  const isLow = p.currentStockPieces <= 24;

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      disabled={isOutOfStock}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isOutOfStock
                          ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                          : "bg-white border-slate-200 hover:border-[#1C398E] hover:shadow-xs active:scale-[0.98]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                          <span className="truncate max-w-[80px]">{p.brand}</span>
                          <span className="font-mono">1C={p.conversionFactor}P</span>
                        </div>
                        <p className="font-bold text-xs text-slate-900 leading-tight line-clamp-1">
                          {p.banglaName || p.name}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-black text-[#1C398E]">
                          ৳{p.wholesalePrice}
                        </span>
                        <span
                          className={`font-semibold text-[10px] ${
                            isOutOfStock
                              ? "text-rose-500"
                              : isLow
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        >
                          {p.stockCartons}C {p.stockPieces}P
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Cart Items List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#1C398E]" />
                <span>{isBn ? "ক্যাশ মেমো আইটেম তালিকা" : "Selected Invoice Items"}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {cart.length} {isBn ? "আইটেম যুক্ত" : "items"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">
                  {isBn ? "কার্টে কোনো পণ্য যোগ করা হয়নি" : "Cart is currently empty"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isBn
                    ? "উপরের পণ্য ক্যাটালগ থেকে ক্লিক করে পণ্য যোগ করুন"
                    : "Tap any product above to add to invoice"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {calculatedItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    {/* Item Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {item.product.banglaName || item.product.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          ({item.product.brand})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        কার্টন দর: ৳{item.product.wholesalePrice} | পিস দর: ৳{item.unitPiecePrice}
                      </p>
                    </div>

                    {/* Dual-UOM Quantity Steppers */}
                    <div className="flex items-center gap-2">
                      {/* Carton Input */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() =>
                            handleUpdateQty(
                              item.product.id,
                              item.cartonQty - 1,
                              item.pieceQty
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="text-center px-1">
                          <input
                            type="number"
                            min="0"
                            value={item.cartonQty}
                            onChange={(e) =>
                              handleUpdateQty(
                                item.product.id,
                                parseInt(e.target.value) || 0,
                                item.pieceQty
                              )
                            }
                            className="w-10 text-center font-bold bg-transparent text-xs focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">
                            কার্টন
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleUpdateQty(
                              item.product.id,
                              item.cartonQty + 1,
                              item.pieceQty
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Loose Piece Input */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() =>
                            handleUpdateQty(
                              item.product.id,
                              item.cartonQty,
                              item.pieceQty - 1
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="text-center px-1">
                          <input
                            type="number"
                            min="0"
                            value={item.pieceQty}
                            onChange={(e) =>
                              handleUpdateQty(
                                item.product.id,
                                item.cartonQty,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-10 text-center font-bold bg-transparent text-xs focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-400 block -mt-1 font-semibold">
                            পিস
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleUpdateQty(
                              item.product.id,
                              item.cartonQty,
                              item.pieceQty + 1
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Line Price */}
                      <div className="w-20 text-right">
                        <p className="font-black text-slate-900 text-xs">
                          ৳ {item.lineTotal.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono">
                          {item.totalPieces} pcs
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="বাতিল করুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Split Payment & Grand Total Checkout Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#1C398E]" />
                <h3 className="font-black text-sm text-slate-900">
                  {isBn ? "পেমেন্ট ও হিসাব বিবরণী" : "Payment & Settlement"}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                ক্যাশ + এমএফএস + বাকি
              </span>
            </div>

            {/* Bill Summary Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{isBn ? "আইটেম সাবটোটাল:" : "Items Subtotal:"}</span>
                <span className="font-bold text-slate-800">৳ {subtotal.toLocaleString()}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600">{isBn ? "ছাড় / ডিসকাউন্ট:" : "Discount (৳):"}</span>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-full text-right px-2 py-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
                <span>{isBn ? "চলতি মেমো বিল:" : "Current Invoice Bill:"}</span>
                <span className="font-black text-[#1C398E]">
                  ৳ {currentBill.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-amber-700 font-semibold">
                <span>{isBn ? "দোকানের পূর্বের বাকি:" : "Previous Outstanding:"}</span>
                <span className="font-bold">
                  + ৳ {previousDue.toLocaleString()}
                </span>
              </div>

              {/* Grand Total */}
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isBn ? "সর্বমোট দেনা (Grand Total)" : "Grand Total"}
                  </p>
                  <p className="text-xl font-black text-white">
                    ৳ {grandTotal.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-[10px] text-slate-300">
                  {cart.length} {isBn ? "আইটেম" : "items"}
                </div>
              </div>
            </div>

            {/* Split Payment Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#1C398E]" />
                <span>{isBn ? "টাকা জমা ও পেমেন্ট পদ্ধতি" : "Payment Collection"}</span>
              </p>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={setExactFullCash}
                  className="py-1.5 px-2 font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  {isBn ? "সম্পূর্ণ ক্যাশ পরিশোধ" : "Full Cash Paid"}
                </button>
                <button
                  type="button"
                  onClick={setCurrentBillCash}
                  className="py-1.5 px-2 font-bold rounded-lg bg-blue-50 text-[#1C398E] border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  {isBn ? "চলতি বিল ক্যাশ" : "Current Bill Cash"}
                </button>
                <button
                  type="button"
                  onClick={setExactbKash}
                  className="py-1.5 px-2 font-bold rounded-lg bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors"
                >
                  {isBn ? "বিকাশ পুরোটা" : "bKash Paid"}
                </button>
                <button
                  type="button"
                  onClick={setFullCreditBaki}
                  className="py-1.5 px-2 font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  {isBn ? "সম্পূর্ণ বাকি (০ জমা)" : "Full Credit (0 Paid)"}
                </button>
              </div>

              {/* Cash Paid Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 flex justify-between">
                  <span>{isBn ? "ক্যাশ জমা (টাকা)" : "Cash Paid (৳)"}</span>
                  <span className="text-slate-400 font-mono text-[10px]">নগদ প্রাপ্তি</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={cashPaidInput}
                  onChange={(e) => setCashPaidInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* MFS Paid Input & Provider */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 flex justify-between">
                  <span>{isBn ? "এমএফএস / অনলাইন জমা (টাকা)" : "MFS / Online Paid (৳)"}</span>
                  <span className="text-slate-400 font-mono text-[10px]">বিকাশ / নগদ</span>
                </label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-7">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={mfsPaidInput}
                      onChange={(e) => setMfsPaidInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold text-blue-800 bg-blue-50/50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="col-span-5">
                    <select
                      value={mfsProvider}
                      onChange={(e) => setMfsProvider(e.target.value)}
                      className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none"
                    >
                      {MFS_PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining Due Box & Credit Warning */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">
                  {isBn ? "মোট পরিশোধ:" : "Total Paid:"}
                </span>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  ৳ {totalPaid.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-xs font-black text-slate-900">
                  {isBn ? "নতুন বকেয়া বাকি (Due):" : "Remaining Due:"}
                </span>
                <span
                  className={`text-base font-black font-mono ${
                    isOverCreditLimit
                      ? "text-rose-600"
                      : remainingDue > 0
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                >
                  ৳ {remainingDue.toLocaleString()}
                </span>
              </div>

              {/* Credit Limit Alert */}
              {isOverCreditLimit && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isBn
                      ? `বাকি সীমা অতিক্রান্ত! দোকানের লিমিট: ৳${retailerCreditLimit.toLocaleString()}`
                      : `Over Credit Limit! Dokan limit is ৳${retailerCreditLimit.toLocaleString()}`}
                  </span>
                </div>
              )}
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleConfirmInvoice}
              disabled={isPending || cart.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1C398E] text-white font-black text-sm hover:bg-[#162d70] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#1C398E]/25 transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isBn ? "মেমো প্রস্তুত হচ্ছে..." : "Generating Invoice..."}</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>
                    {isBn ? "ক্যাশ মেমো সম্পন্ন ও প্রিন্ট করুন" : "Confirm Invoice & Print"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Completed Thermal Cash Memo Modal */}
      {completedInvoice && (
        <ThermalCashMemo
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
          onNewSale={() => {
            setCompletedInvoice(null);
            handleClearCart();
          }}
        />
      )}
    </div>
  );
}
