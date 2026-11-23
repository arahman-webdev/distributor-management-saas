"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import {
  SanitizedProduct,
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/lib/actions/product-actions";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Shield,
  Edit2,
  Trash2,
  X,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { roundCurrency, toTotalPieces } from "@/lib/calculations";

interface ProductCatalogViewProps {
  initialProducts: SanitizedProduct[];
  categories: string[];
  brands: string[];
  role: string;
  metrics: {
    totalProducts: number;
    lowStockCount: number;
    totalStockPieces: number;
    inventoryValuation: number | null;
  };
}

export default function ProductCatalogView({
  initialProducts,
  categories,
  brands,
  role,
  metrics,
}: ProductCatalogViewProps) {
  const { locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  const isSR = role === "SR";
  const isOwner = role === "OWNER";
  const canManage = role === "OWNER" || role === "MANAGER";

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SanitizedProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<SanitizedProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for Add Product
  const [formData, setFormData] = useState({
    name: "",
    banglaName: "",
    brand: "",
    category: "",
    uomPrimary: "Carton",
    uomSub: "Pcs",
    conversionFactor: 24,
    purchaseCost: 2000,
    wholesalePrice: 2400,
    wholesalePiecePrice: 100,
    mrp: 110,
    minStockAlert: 120,
    initialStockCartons: 10,
    initialStockPieces: 0,
  });

  // Calculate live Dual-UOM preview for form
  const previewPieces = toTotalPieces(
    Number(formData.initialStockCartons || 0),
    Number(formData.initialStockPieces || 0),
    Number(formData.conversionFactor || 1)
  );

  const autoDerivedPiecePrice =
    formData.conversionFactor > 0 && formData.wholesalePrice > 0
      ? roundCurrency(formData.wholesalePrice / formData.conversionFactor)
      : 0;

  const grossMarginPercent =
    formData.purchaseCost > 0 && formData.wholesalePrice > formData.purchaseCost
      ? roundCurrency(
          ((formData.wholesalePrice - formData.purchaseCost) /
            formData.wholesalePrice) *
            100
        )
      : 0;

  // Client-side filtering
  const filteredProducts = initialProducts.filter((product) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.banglaName && product.banglaName.includes(searchTerm)) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "ALL" || product.category === selectedCategory;

    const matchesBrand =
      selectedBrand === "ALL" || product.brand === selectedBrand;

    const matchesLowStock = !lowStockOnly || product.isLowStock;

    return matchesSearch && matchesCategory && matchesBrand && matchesLowStock;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await createProductAction({
        name: formData.name,
        banglaName: formData.banglaName || undefined,
        brand: formData.brand,
        category: formData.category,
        uomPrimary: formData.uomPrimary,
        uomSub: formData.uomSub,
        conversionFactor: Number(formData.conversionFactor),
        purchaseCost: Number(formData.purchaseCost),
        wholesalePrice: Number(formData.wholesalePrice),
        wholesalePiecePrice: formData.wholesalePiecePrice
          ? Number(formData.wholesalePiecePrice)
          : undefined,
        mrp: formData.mrp ? Number(formData.mrp) : undefined,
        minStockAlert: Number(formData.minStockAlert),
        initialStockCartons: Number(formData.initialStockCartons),
        initialStockPieces: Number(formData.initialStockPieces),
      });

      if (!res.success) {
        setErrorMsg(res.error || "পণ্য তৈরি করতে সমস্যা হয়েছে।");
      } else {
        setSuccessMsg("নতুন পণ্য সফলভাবে যুক্ত করা হয়েছে!");
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          name: "",
          banglaName: "",
          brand: "",
          category: "",
          uomPrimary: "Carton",
          uomSub: "Pcs",
          conversionFactor: 24,
          purchaseCost: 0,
          wholesalePrice: 0,
          wholesalePiecePrice: 0,
          mrp: 0,
          minStockAlert: 120,
          initialStockCartons: 0,
          initialStockPieces: 0,
        });
      }
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await updateProductAction(editingProduct.id, {
        name: editingProduct.name,
        banglaName: editingProduct.banglaName || undefined,
        brand: editingProduct.brand,
        category: editingProduct.category,
        uomPrimary: editingProduct.uomPrimary,
        uomSub: editingProduct.uomSub,
        conversionFactor: Number(editingProduct.conversionFactor),
        purchaseCost:
          editingProduct.purchaseCost !== null
            ? Number(editingProduct.purchaseCost)
            : undefined,
        wholesalePrice: Number(editingProduct.wholesalePrice),
        wholesalePiecePrice: editingProduct.wholesalePiecePrice
          ? Number(editingProduct.wholesalePiecePrice)
          : undefined,
        mrp: editingProduct.mrp ? Number(editingProduct.mrp) : undefined,
        minStockAlert: Number(editingProduct.minStockAlert),
      });

      if (!res.success) {
        setErrorMsg(res.error || "আপডেট ব্যর্থ হয়েছে।");
      } else {
        setSuccessMsg("পণ্য সফলভাবে আপডেট করা হয়েছে!");
        setEditingProduct(null);
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await deleteProductAction(deletingProduct.id);
      if (!res.success) {
        setErrorMsg(res.error || "মুছে ফেলা ব্যর্থ হয়েছে।");
      } else {
        setSuccessMsg("পণ্য সফলভাবে মুছে ফেলা হয়েছে!");
        setDeletingProduct(null);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1C398E]/10 text-[#1C398E] border border-[#1C398E]/20">
              Day 4 Master Data
            </span>
            {isSR && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Shield className="w-3 h-3 text-slate-500" />
                SR View Only
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {locale === "bn" ? "পণ্য তালিকা ও স্টক হিসাব" : "Product Catalog & Stock"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {locale === "bn"
              ? "কার্টন ও পিস ডুয়েল ইউনিট হিসাব, পাইকারি দর এবং স্টক ট্র্যাকিং।"
              : "Dual-UOM carton/piece management, pricing rules, and stock thresholds."}
          </p>
        </div>

        {/* Action Button (Hidden for SR) */}
        {canManage && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white text-xs font-bold shadow-md shadow-[#1C398E]/25 transition-all hover:scale-102 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === "bn" ? "নতুন পণ্য যোগ করুন" : "Add Product"}</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards (Styled with #1C398E Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total SKUs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#1C398E]/10 text-[#1C398E] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              SKUs
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "মোট আইটেম সংখ্যা" : "Total Products"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalProducts}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "ডিপো ক্যাটালগ" : "Active in Catalog"}
            </p>
          </div>
        </div>

        {/* Card 2: Low Stock Warning */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                metrics.lowStockCount > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {metrics.lowStockCount > 0 ? "Alert" : "Healthy"}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "কম স্টক সতর্কবার্তা" : "Low Stock Alerts"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.lowStockCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "রিঅর্ডার প্রয়োজন" : "Needs Reorder"}
            </p>
          </div>
        </div>

        {/* Card 3: Total Stock in Pieces */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Dual-UOM
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "মোট স্টক (পিস হিসেবে)" : "Total Stock (Pcs)"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalStockPieces.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "বেইজ ইউনিট পিস" : "Base Pieces Count"}
            </p>
          </div>
        </div>

        {/* Card 4: Inventory Valuation (Protected from SR) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#1C398E]/10 text-[#1C398E] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Cost Value
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "স্টক মূল্যায়ন (ক্রয়মূল্য)" : "Stock Valuation"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {isSR
                ? "গোপনীয় (Protected)"
                : `৳${(metrics.inventoryValuation || 0).toLocaleString()}`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isSR
                ? "মালিক ও ম্যানেজারের দৃশ্যমান"
                : "Total Godown Asset Value"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              locale === "bn"
                ? "পণ্যের নাম, বাংলা নাম বা ব্র্যান্ড খুঁজুন..."
                : "Search by product name, bangla name, or brand..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1C398E] focus:bg-white transition-all"
          />
        </div>

        {/* Dropdowns & Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1C398E]"
          >
            <option value="ALL">
              {locale === "bn" ? "সকল ক্যাটাগরি" : "All Categories"}
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Brand Dropdown */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1C398E]"
          >
            <option value="ALL">
              {locale === "bn" ? "সকল ব্র্যান্ড" : "All Brands"}
            </option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle Button */}
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              lowStockOnly
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{locale === "bn" ? "কম স্টক" : "Low Stock"}</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">{locale === "bn" ? "পণ্যের বিবরণ" : "Product"}</th>
                <th className="py-3.5 px-4">{locale === "bn" ? "ব্র্যান্ড / ক্যাটাগরি" : "Brand / Cat"}</th>
                <th className="py-3.5 px-4 text-center">{locale === "bn" ? "কার্টন অনুপাত" : "UOM Ratio"}</th>
                <th className="py-3.5 px-4">{locale === "bn" ? "বর্তমান স্টক (Dual-UOM)" : "Stock Level"}</th>
                <th className="py-3.5 px-4 text-right">{locale === "bn" ? "পাইকারি কার্টন" : "Carton Rate"}</th>
                <th className="py-3.5 px-4 text-right">{locale === "bn" ? "খুচরা পিস দর" : "Piece Rate"}</th>
                <th className="py-3.5 px-4 text-right">{locale === "bn" ? "এমআরপি (MRP)" : "MRP"}</th>
                {!isSR && (
                  <th className="py-3.5 px-4 text-right text-[#1C398E]">
                    {locale === "bn" ? "ক্রয়মূল্য (Cost)" : "Purchase Cost"}
                  </th>
                )}
                {canManage && (
                  <th className="py-3.5 px-4 text-center">{locale === "bn" ? "অ্যাকশন" : "Actions"}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? (!isSR ? 9 : 8) : !isSR ? 8 : 7}
                    className="py-12 text-center text-slate-400"
                  >
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">
                      {locale === "bn"
                        ? "কোনো পণ্য পাওয়া যায়নি।"
                        : "No products found matching filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Product Name */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {p.name}
                        </span>
                        {p.banglaName && (
                          <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                            {p.banglaName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Brand & Category */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-bold text-slate-800 text-[11px]">
                          {p.brand}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {p.category}
                        </span>
                      </div>
                    </td>

                    {/* Dual-UOM Conversion Ratio */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100/80 px-2 py-1 rounded-md text-[11px]">
                        1 {p.uomPrimary} = {p.conversionFactor} {p.uomSub}
                      </span>
                    </td>

                    {/* Stock in Dual-UOM (Carton + Pieces) */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 font-extrabold text-xs">
                            {p.stockCartons} {p.uomPrimary}
                          </strong>
                          {p.stockRemainingPieces > 0 && (
                            <span className="text-slate-600 font-bold text-[11px]">
                              + {p.stockRemainingPieces} {p.uomSub}
                            </span>
                          )}
                        </div>
                        {p.isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            {locale === "bn" ? "স্টক কম!" : "Low Stock"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            মোট: {p.currentStockPieces} {p.uomSub}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Wholesale Carton Price */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      ৳{p.wholesalePrice.toLocaleString()}
                    </td>

                    {/* Wholesale Piece Rate */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                      ৳{p.derivedPieceRate}
                    </td>

                    {/* MRP */}
                    <td className="py-3.5 px-4 text-right text-slate-500 font-semibold">
                      {p.mrp ? `৳${p.mrp}` : "—"}
                    </td>

                    {/* Purchase Cost (Hidden from SR) */}
                    {!isSR && (
                      <td className="py-3.5 px-4 text-right font-bold text-[#1C398E]">
                        ৳{(p.purchaseCost || 0).toLocaleString()}
                      </td>
                    )}

                    {/* Actions (Owner & Manager) */}
                    {canManage && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#1C398E] hover:bg-slate-100 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {locale === "bn" ? "নতুন পণ্য ও ডুয়েল-ইউনিট যুক্ত করুন" : "Add Product (Dual-UOM)"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === "bn"
                    ? "কার্টন রেট ও কনভার্সন অনুযায়ী পিস রেট স্বয়ংক্রিয়ভাবে তৈরি হবে।"
                    : "Automatic carton-to-piece rate calculation and stock setup."}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Product Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পণ্যের নাম (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Radhuni Mustard Oil 500ml"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বাংলা নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={formData.banglaName}
                    onChange={(e) =>
                      setFormData({ ...formData, banglaName: e.target.value })
                    }
                    placeholder="যেমন: রাঁধুনী সরিষার তেল ৫০০ মিলি"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Brand & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কোম্পানি / ব্র্যান্ড *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Square, Unilever, PRAN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পণ্যের ক্যাটাগরি *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g. Oil, Biscuits, Soap, Beverage"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dual-UOM Configuration */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <span className="text-xs font-extrabold text-[#1C398E] flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  ডুয়েল-ইউনিট সেটআপ (Dual-UOM Configuration)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      মূল একক (Carton)
                    </label>
                    <input
                      type="text"
                      value={formData.uomPrimary}
                      onChange={(e) =>
                        setFormData({ ...formData, uomPrimary: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      সাব একক (Piece)
                    </label>
                    <input
                      type="text"
                      value={formData.uomSub}
                      onChange={(e) =>
                        setFormData({ ...formData, uomSub: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1C398E] mb-1">
                      ১ কার্টনে কত পিস? *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.conversionFactor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conversionFactor: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-bold text-[#1C398E] focus:ring-2 focus:ring-[#1C398E] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    কার্টন ক্রয়মূল্য (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.purchaseCost}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    কার্টন বিক্রয়মূল্য (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.wholesalePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    খুচরা পিস দর (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.wholesalePiecePrice || autoDerivedPiecePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wholesalePiecePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    গায়ের রেট (MRP ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) =>
                      setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
              </div>

              {/* Initial Stock Inputs */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800">
                  প্রারম্ভিক স্টক এন্ট্রি (Opening Stock)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      কার্টন সংখ্যা
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.initialStockCartons}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialStockCartons: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#1C398E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      লুজ পিস
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.initialStockPieces}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialStockPieces: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#1C398E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      কম স্টক অ্যালার্ট (পিস)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.minStockAlert}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minStockAlert: parseInt(e.target.value) || 120,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-[#1C398E]"
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">মোট স্টক হিসাব:</span>
                    <strong className="text-slate-900 font-black">
                      {formData.initialStockCartons} কার্টন + {formData.initialStockPieces} পিস = {previewPieces} পিস
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">আনুমানিক মার্জিন:</span>
                    <strong className="text-emerald-700 font-bold">
                      {grossMarginPercent}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white text-xs font-bold shadow-md shadow-[#1C398E]/25 disabled:opacity-50"
                >
                  {isPending ? "সংরক্ষণ হচ্ছে..." : "পণ্য নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-black text-slate-900">
                পণ্য এডিট করুন ({editingProduct.name})
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পণ্যের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বাংলা নাম
                </label>
                <input
                  type="text"
                  value={editingProduct.banglaName || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      banglaName: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ব্র্যান্ড
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, brand: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
              </div>

              {/* Dual-UOM Conversion */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ১ কার্টনে পিস
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingProduct.conversionFactor}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        conversionFactor: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কার্টন রেট (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editingProduct.wholesalePrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        wholesalePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পিস রেট (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      editingProduct.wholesalePiecePrice ||
                      roundCurrency(
                        editingProduct.wholesalePrice /
                          editingProduct.conversionFactor
                      )
                    }
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        wholesalePiecePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
              </div>

              {!isSR && editingProduct.purchaseCost !== null && (
                <div>
                  <label className="block text-xs font-bold text-[#1C398E] mb-1">
                    ক্রয়মূল্য প্রতি কার্টন (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingProduct.purchaseCost}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        purchaseCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-bold focus:ring-2 focus:ring-[#1C398E]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white text-xs font-bold shadow-md shadow-[#1C398E]/25 disabled:opacity-50"
                >
                  {isPending ? "আপডেট হচ্ছে..." : "আপডেট নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Product Confirmation */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">
              পণ্য মুছে ফেলার সতর্কতা
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              আপনি কি নিশ্চিতভাবে <strong>{deletingProduct.name}</strong> পণ্যটি ডিলিট করতে চান?
              যদি এই পণ্যের কোনো বিক্রয় চালান থেকে থাকে তবে ডেটা সুরক্ষার কারণে ডিলিট প্রতিরোধ করা হবে।
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/30 disabled:opacity-50"
              >
                {isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
