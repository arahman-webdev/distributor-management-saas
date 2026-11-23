"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import {
  SanitizedStockTransaction,
  recordStockInwardAction,
  bulkImportProductsCSVAction,
  CSVProductRow,
} from "@/lib/actions/inventory-actions";
import {
  Truck,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Upload,
  Calendar,
  Building,
  Hash,
  Trash2,
  Check,
  RefreshCw,
} from "lucide-react";
import { toTotalPieces } from "@/lib/calculations";

interface AvailableProduct {
  id: string;
  name: string;
  banglaName: string | null;
  brand: string;
  category: string;
  uomPrimary: string;
  uomSub: string;
  conversionFactor: number;
  purchaseCost: number;
  wholesalePrice: number;
}

interface InventoryViewProps {
  initialTransactions: SanitizedStockTransaction[];
  availableProducts: AvailableProduct[];
  metrics: {
    totalInwardCartonsToday: number;
    totalTransactionsToday: number;
    totalTransactionsAllTime: number;
  };
}

export default function InventoryView({
  initialTransactions,
  availableProducts,
  metrics,
}: InventoryViewProps) {
  const { locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");

  // Modal states
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Stock Inward Form State
  const [challanForm, setChallanForm] = useState({
    challanNumber: "",
    supplierName: "",
    challanDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [inwardItems, setInwardItems] = useState<
    Array<{
      productId: string;
      cartonQty: number;
      pieceQty: number;
      purchaseCostPerCarton: number;
    }>
  >([
    {
      productId: availableProducts[0]?.id || "",
      cartonQty: 10,
      pieceQty: 0,
      purchaseCostPerCarton: availableProducts[0]?.purchaseCost || 0,
    },
  ]);

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState("");
  const [parsedRows, setParsedRows] = useState<CSVProductRow[]>([]);
  const [csvParseErrors, setCsvParseErrors] = useState<string[]>([]);

  // Filtered transactions
  const filteredTransactions = initialTransactions.filter((tx) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      tx.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.referenceId && tx.referenceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === "ALL" || tx.type === selectedType;

    return matchesSearch && matchesType;
  });

  // Calculate live challan summary
  const challanSummary = inwardItems.reduce(
    (acc, item) => {
      const prod = availableProducts.find((p) => p.id === item.productId);
      const conversion = prod?.conversionFactor || 24;
      const pieces = toTotalPieces(
        Number(item.cartonQty || 0),
        Number(item.pieceQty || 0),
        conversion
      );
      const costPerCarton = Number(
        item.purchaseCostPerCarton || prod?.purchaseCost || 0
      );
      const value =
        Number(item.cartonQty || 0) * costPerCarton +
        (Number(item.pieceQty || 0) * costPerCarton) / conversion;

      return {
        totalCartons: acc.totalCartons + Number(item.cartonQty || 0),
        totalPieces: acc.totalPieces + pieces,
        totalValue: acc.totalValue + value,
      };
    },
    { totalCartons: 0, totalPieces: 0, totalValue: 0 }
  );

  const handleAddInwardRow = () => {
    const defaultProd = availableProducts[0];
    setInwardItems([
      ...inwardItems,
      {
        productId: defaultProd?.id || "",
        cartonQty: 5,
        pieceQty: 0,
        purchaseCostPerCarton: defaultProd?.purchaseCost || 0,
      },
    ]);
  };

  const handleRemoveInwardRow = (index: number) => {
    if (inwardItems.length <= 1) return;
    setInwardItems(inwardItems.filter((_, i) => i !== index));
  };

  const handleProductSelectChange = (index: number, productId: string) => {
    const prod = availableProducts.find((p) => p.id === productId);
    const updated = [...inwardItems];
    updated[index].productId = productId;
    if (prod) {
      updated[index].purchaseCostPerCarton = prod.purchaseCost;
    }
    setInwardItems(updated);
  };

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await recordStockInwardAction({
        challanNumber: challanForm.challanNumber,
        supplierName: challanForm.supplierName,
        challanDate: challanForm.challanDate,
        notes: challanForm.notes,
        items: inwardItems,
      });

      if (!res.success) {
        setErrorMsg(res.error || "চালান ইনওয়ার্ড এন্ট্রি ব্যর্থ হয়েছে।");
      } else {
        setSuccessMsg(
          locale === "bn"
            ? `চালান #${res.challanNumber} সফলভাবে গ্রহণ করা হয়েছে! মোট ${res.totalPiecesAdded} পিস স্টক বৃদ্ধি পেয়েছে।`
            : `Challan #${res.challanNumber} recorded successfully! Total ${res.totalPiecesAdded} pieces added to stock.`
        );
        setIsInwardModalOpen(false);
        setChallanForm({
          challanNumber: "",
          supplierName: "",
          challanDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    });
  };

  // CSV Parsing
  const handleParseCsv = (text: string) => {
    setCsvRawText(text);
    setCsvParseErrors([]);
    setParsedRows([]);

    if (!text.trim()) return;

    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setCsvParseErrors(["CSV ফাইলে হেডার সহ ন্যূনতম ১টি ডেটা লাইন থাকতে হবে"]);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: CSVProductRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || "";
      });

      const name = rowObj.name || rowObj.productname || cols[0];
      const banglaName = rowObj.banglaname || cols[1] || "";
      const brand = rowObj.brand || rowObj.company || cols[2];
      const category = rowObj.category || cols[3];
      const conversionFactor = parseInt(rowObj.conversionfactor || rowObj.pcspercarton || cols[4]) || 24;
      const purchaseCost = parseFloat(rowObj.purchasecost || rowObj.cost || cols[5]) || 0;
      const wholesalePrice = parseFloat(rowObj.wholesaleprice || rowObj.sellingprice || cols[6]) || 0;
      const wholesalePiecePrice = parseFloat(rowObj.piecerate || cols[7]) || undefined;
      const mrp = parseFloat(rowObj.mrp || cols[8]) || undefined;
      const openingStockCartons = parseInt(rowObj.openingstockcartons || cols[9]) || 0;
      const openingStockPieces = parseInt(rowObj.openingstockpieces || cols[10]) || 0;

      if (!name || !brand || !category) {
        errors.push(`সারি ${i + 1}: নাম, ব্র্যান্ড বা ক্যাটাগরি অনুপস্থিত`);
      } else {
        rows.push({
          name,
          banglaName: banglaName || undefined,
          brand,
          category,
          conversionFactor,
          purchaseCost,
          wholesalePrice,
          wholesalePiecePrice,
          mrp,
          openingStockCartons,
          openingStockPieces,
        });
      }
    }

    setCsvParseErrors(errors);
    setParsedRows(rows);
  };

  const handleCsvSubmit = () => {
    if (parsedRows.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await bulkImportProductsCSVAction(parsedRows);
      if (!res.success) {
        setErrorMsg(res.error || "CSV ইম্পোর্ট ব্যর্থ হয়েছে।");
      } else {
        setSuccessMsg(
          locale === "bn"
            ? `সফলভাবে ${res.importedCount}টি পণ্য এবং স্টক ইম্পোর্ট সম্পন্ন হয়েছে!`
            : `Successfully imported ${res.importedCount} products with opening stock!`
        );
        setIsCsvModalOpen(false);
        setCsvRawText("");
        setParsedRows([]);
      }
    });
  };

  const handleDownloadSampleCsv = () => {
    const csvContent =
      "name,banglaName,brand,category,conversionFactor,purchaseCost,wholesalePrice,pieceRate,mrp,openingStockCartons,openingStockPieces\n" +
      "Pran Chinigura Rice 1kg,প্রাণ চিনিগুড়া চাল ১ কেজি,PRAN,Rice,24,2400,2880,120,130,10,0\n" +
      "Radhuni Mustard Oil 500ml,রাঁধুনী সরিষার তেল ৫০০মিলি,Square,Edible Oil,20,3000,3400,170,185,15,5\n" +
      "Lux Beauty Soap 100g,লাক্স সাবান ১০০ গ্রাম,Unilever,Soap,48,2160,2640,55,60,25,12\n" +
      "Bombay Potato Crackers 20tk,বম্বে পটেটো চিপস ২০ টাকা,Bombay Sweets,Snacks,60,960,1140,19,20,50,0\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "distribo_products_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1C398E]/10 text-[#1C398E] border border-[#1C398E]/20">
              Day 5 Stock Inward
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Dual-UOM Supply Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {locale === "bn"
              ? "স্টক ইনওয়ার্ড ও চালান রিসিভ"
              : "Stock Inward & Challan Entry"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {locale === "bn"
              ? "কোম্পানি ট্রাক ডেলিভারি রিসিভ, কার্টন ও পিস স্টক ইন এবং এক্সেল/CSV ইম্পোর্ট।"
              : "Receive company supplier challans, update carton/piece stocks, and bulk import products."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Sample CSV Download */}
          <button
            onClick={handleDownloadSampleCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all"
            title="Download CSV Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">নমুনা CSV</span>
          </button>

          {/* Bulk CSV Import Button */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#1C398E] text-xs font-bold shadow-2xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1C398E]" />
            <span>{locale === "bn" ? "CSV ইম্পোর্ট" : "Import CSV"}</span>
          </button>

          {/* New Challan / Stock Inward Button */}
          <button
            onClick={() => setIsInwardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white text-xs font-bold shadow-md shadow-[#1C398E]/25 transition-all hover:scale-102"
          >
            <Truck className="w-4 h-4" />
            <span>{locale === "bn" ? "+ নতুন চালান এন্ট্রি" : "+ Stock Inward"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Inward Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#1C398E]/10 text-[#1C398E] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Today
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "আজকের চালান রিসিভ" : "Inward Cartons Today"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalInwardCartonsToday} কার্টন
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "কোম্পানি ট্রাক ডেলিভারি" : "Supplier Deliveries"}
            </p>
          </div>
        </div>

        {/* Metric 2: Today's Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Movement
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "আজকের স্টক লেনদেন" : "Transactions Today"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalTransactionsToday} টি
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "ইনওয়ার্ড ও স্টক এডজাস্ট" : "Stock In/Out Logs"}
            </p>
          </div>
        </div>

        {/* Metric 3: Total Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              All Time
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "মোট স্টক মুভমেন্ট রেকর্ড" : "Total Stock Logs"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalTransactionsAllTime}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "অডিট লেজার সুরক্ষিত" : "Immutable Audit Trail"}
            </p>
          </div>
        </div>

        {/* Metric 4: Dual-UOM Support */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              Active
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "ক্যাটালগ পণ্য আইটেম" : "Catalog Items"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {availableProducts.length} টি
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "কার্টন ↔ পিস কনভার্সন" : "Carton ↔ Piece Math"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              locale === "bn"
                ? "চালান #, পণ্য বা কোম্পানির নাম খুঁজুন..."
                : "Search by challan #, product, or supplier..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1C398E] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1C398E]"
          >
            <option value="ALL">
              {locale === "bn" ? "সকল ধরন (All Types)" : "All Types"}
            </option>
            <option value="PURCHASE_IN">Purchase In (চালান ইনওয়ার্ড)</option>
            <option value="SALE_OUT">Sale Out (মেমো বিক্রয়)</option>
            <option value="RETURN_RESTOCK">Return Restock (ফেরত)</option>
            <option value="DAMAGE_OUT">Damage Out (নষ্ট/ড্যামেজ)</option>
            <option value="ADJUSTMENT">Adjustment (এডজাস্টমেন্ট)</option>
          </select>
        </div>
      </div>

      {/* Stock Transactions Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">{locale === "bn" ? "তারিখ ও সময়" : "Date & Time"}</th>
                <th className="py-3.5 px-4 text-center">{locale === "bn" ? "লেনদেনের ধরন" : "Type"}</th>
                <th className="py-3.5 px-4">{locale === "bn" ? "পণ্যের নাম ও ব্র্যান্ড" : "Product"}</th>
                <th className="py-3.5 px-4 text-center">{locale === "bn" ? "পরিমাণ (Dual-UOM)" : "Quantity (Carton / Pcs)"}</th>
                <th className="py-3.5 px-4 text-center">{locale === "bn" ? "বেইজ পিস" : "Base Pieces"}</th>
                <th className="py-3.5 px-4">{locale === "bn" ? "রেফারেন্স / চালান #" : "Challan / Ref #"}</th>
                <th className="py-3.5 px-4">{locale === "bn" ? "সাপ্লায়ার ও নোট" : "Supplier & Notes"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">
                      {locale === "bn"
                        ? "কোনো স্টক ট্রানজ্যাকশন পাওয়া যায়নি।"
                        : "No stock transactions recorded yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPositive = tx.isPositive;
                  const typeBadge =
                    tx.type === "PURCHASE_IN" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200 text-[10px]">
                        <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        PURCHASE IN
                      </span>
                    ) : tx.type === "SALE_OUT" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold border border-blue-200 text-[10px]">
                        <ArrowUpRight className="w-3 h-3 text-blue-600" />
                        SALE OUT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200 text-[10px]">
                        {tx.type}
                      </span>
                    );

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString(
                          locale === "bn" ? "bn-BD" : "en-US",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 text-center">{typeBadge}</td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {tx.product.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {tx.product.brand} • {tx.product.category}
                          </span>
                        </div>
                      </td>

                      {/* Dual-UOM Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-black text-xs ${
                            isPositive ? "text-emerald-700" : "text-blue-700"
                          }`}
                        >
                          {isPositive ? "+" : "-"}
                          {tx.cartons} {tx.product.uomPrimary}
                          {tx.pieces > 0 && ` ${tx.pieces} ${tx.product.uomSub}`}
                        </span>
                      </td>

                      {/* Base Pieces */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {isPositive ? "+" : ""}
                        {tx.quantityPieces} {tx.product.uomSub}
                      </td>

                      {/* Reference # */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {tx.referenceId || "—"}
                        </span>
                      </td>

                      {/* Notes / Supplier */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-[200px] truncate">
                        {tx.notes || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Stock Inward (Challan Entry) */}
      {isInwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {locale === "bn"
                    ? "কোম্পানি চালান ইনওয়ার্ড ও মাল রিসিভ"
                    : "Supplier Delivery Challan Entry"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === "bn"
                    ? "ট্রাক থেকে নামানো পণ্য কার্টন ও পিস হিসাবে স্বয়ংক্রিয়ভাবে স্টক যুক্ত হবে।"
                    : "Receive goods from company truck and update depot stock atomically."}
                </p>
              </div>
              <button
                onClick={() => setIsInwardModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-4">
              {/* Challan Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কোম্পানি চালান নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={challanForm.challanNumber}
                    onChange={(e) =>
                      setChallanForm({ ...challanForm, challanNumber: e.target.value })
                    }
                    placeholder="e.g. CH-2026-9011"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সাপ্লায়ার / কোম্পানি নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={challanForm.supplierName}
                    onChange={(e) =>
                      setChallanForm({ ...challanForm, supplierName: e.target.value })
                    }
                    placeholder="e.g. Unilever, PRAN, Square"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    চালান তারিখ
                  </label>
                  <input
                    type="date"
                    value={challanForm.challanDate}
                    onChange={(e) =>
                      setChallanForm({ ...challanForm, challanDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-Item Line Rows */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">
                    রিসিভকৃত পণ্যের তালিকা (Line Items)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddInwardRow}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#1C398E] hover:bg-slate-50 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ আরও পণ্য যোগ করুন</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {inwardItems.map((item, idx) => {
                    const prod = availableProducts.find((p) => p.id === item.productId);
                    const conversion = prod?.conversionFactor || 24;
                    const linePieces = toTotalPieces(
                      Number(item.cartonQty || 0),
                      Number(item.pieceQty || 0),
                      conversion
                    );

                    return (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-12 gap-2 items-center"
                      >
                        {/* Product Picker */}
                        <div className="col-span-12 sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            পণ্য নির্বাচন *
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelectChange(idx, e.target.value)}
                            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-[#1C398E]"
                          >
                            {availableProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.brand}) • 1 Ctn={p.conversionFactor} Pcs
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Cartons */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            কার্টন সংখ্যা
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.cartonQty}
                            onChange={(e) => {
                              const updated = [...inwardItems];
                              updated[idx].cartonQty = parseInt(e.target.value) || 0;
                              setInwardItems(updated);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        {/* Loose Pieces */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            লুজ পিস
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.pieceQty}
                            onChange={(e) => {
                              const updated = [...inwardItems];
                              updated[idx].pieceQty = parseInt(e.target.value) || 0;
                              setInwardItems(updated);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        {/* Purchase Cost per Carton */}
                        <div className="col-span-3 sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            ক্রয়মূল্য (৳/কার্টন)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.purchaseCostPerCarton}
                            onChange={(e) => {
                              const updated = [...inwardItems];
                              updated[idx].purchaseCostPerCarton =
                                parseFloat(e.target.value) || 0;
                              setInwardItems(updated);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-bold text-[#1C398E]"
                          />
                        </div>

                        {/* Delete Row Button */}
                        <div className="col-span-1 sm:col-span-1 flex items-center justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveInwardRow(idx)}
                            disabled={inwardItems.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Challan Summary Pill */}
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-wrap items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">চালানের মোট স্টক:</span>
                    <strong className="text-slate-900 font-black">
                      {challanSummary.totalCartons} কার্টন ({challanSummary.totalPieces} পিস)
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px] block">মোট চালান মূল্য:</span>
                    <strong className="text-[#1C398E] font-black text-sm">
                      ৳{challanSummary.totalValue.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নোট / ট্রাক ড্রাইভার তথ্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={challanForm.notes}
                  onChange={(e) =>
                    setChallanForm({ ...challanForm, notes: e.target.value })
                  }
                  placeholder="যেমন: ঢাকা মেট্রো-ট ১২-৩৪৫৬ ট্রাক ডেলিভারি"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInwardModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white text-xs font-bold shadow-md shadow-[#1C398E]/25 disabled:opacity-50"
                >
                  {isPending ? "রিসিভ হচ্ছে..." : "চালান সংরক্ষণ ও স্টক আপডেট"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk CSV Import */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {locale === "bn"
                    ? "CSV বা এক্সেল থেকে পণ্য ও স্টক ইম্পোর্ট"
                    : "Bulk Product CSV Import"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === "bn"
                    ? "এক ক্লিকে আপনার সমস্ত পণ্য ও প্রারম্ভিক স্টক আপলোড করুন।"
                    : "Import product catalog items, prices, and opening stock in bulk."}
                </p>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File input / Paste area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    CSV ফাইল পেস্ট করুন অথবা আপলোড করুন
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="text-xs font-bold text-[#1C398E] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>নমুনা CSV ডাউনলোড</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvRawText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  placeholder="name,banglaName,brand,category,conversionFactor,purchaseCost,wholesalePrice,pieceRate,mrp,openingStockCartons,openingStockPieces&#10;Pran Chinigura Rice 1kg,প্রাণ চিনিগুড়া চাল ১ কেজি,PRAN,Rice,24,2400,2880,120,130,10,0"
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                />
              </div>

              {/* Parsing Errors */}
              {csvParseErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
                  <strong>CSV ফরম্যাটে ত্রুটি:</strong>
                  {csvParseErrors.slice(0, 3).map((err, idx) => (
                    <p key={idx}>{err}</p>
                  ))}
                </div>
              )}

              {/* Live Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      ইম্পোর্ট প্রিভিউ ({parsedRows.length}টি পণ্য প্রস্তুত)
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Valid Ready
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="p-2">নাম</th>
                          <th className="p-2">ব্র্যান্ড</th>
                          <th className="p-2 text-center">কার্টন অনুপাত</th>
                          <th className="p-2 text-right">ক্রয়মূল্য</th>
                          <th className="p-2 text-right">বিক্রয়মূল্য</th>
                          <th className="p-2 text-center">স্টক কার্টন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold text-slate-800">{r.name}</td>
                            <td className="p-2 text-slate-600">{r.brand}</td>
                            <td className="p-2 text-center">1 Ctn = {r.conversionFactor} Pcs</td>
                            <td className="p-2 text-right">৳{r.purchaseCost}</td>
                            <td className="p-2 text-right font-bold text-[#1C398E]">৳{r.wholesalePrice}</td>
                            <td className="p-2 text-center font-bold">{r.openingStockCartons}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 10 && (
                    <p className="text-[11px] text-slate-400 text-center">
                      ... আরও {parsedRows.length - 10}টি পণ্য তালিকায় অন্তর্ভুক্ত রয়েছে
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleCsvSubmit}
                  disabled={isPending || parsedRows.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white text-xs font-bold shadow-md shadow-[#1C398E]/25 disabled:opacity-50"
                >
                  {isPending ? "ইম্পোর্ট হচ্ছে..." : `${parsedRows.length}টি পণ্য ইম্পোর্ট নিশ্চিত করুন`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
