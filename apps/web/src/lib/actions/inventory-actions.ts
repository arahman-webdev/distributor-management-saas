"use server";

import { prisma } from "@distribo/db";
import { getCurrentSession } from "@/lib/actions/auth-actions";
import { requireTenantAccess, AuthorizationError } from "@distribo/auth";
import {
  toTotalPieces,
  toCartonPieceBreakdown,
  roundCurrency,
} from "@/lib/calculations";
import { revalidatePath } from "next/cache";

export interface StockInwardItem {
  productId: string;
  cartonQty: number;
  pieceQty: number;
  purchaseCostPerCarton?: number;
}

export interface StockInwardInput {
  challanNumber: string;
  supplierName: string;
  challanDate?: string;
  notes?: string;
  items: StockInwardItem[];
}

export interface CSVProductRow {
  name: string;
  banglaName?: string;
  brand: string;
  category: string;
  uomPrimary?: string;
  uomSub?: string;
  conversionFactor: number;
  purchaseCost: number;
  wholesalePrice: number;
  wholesalePiecePrice?: number;
  mrp?: number;
  minStockAlert?: number;
  openingStockCartons?: number;
  openingStockPieces?: number;
}

export interface SanitizedStockTransaction {
  id: string;
  type: string;
  quantityPieces: number;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date;
  product: {
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
  };
  cartons: number;
  pieces: number;
  isPositive: boolean;
}

export interface StockHistoryResponse {
  success: boolean;
  error?: string;
  transactions: SanitizedStockTransaction[];
  metrics: {
    totalInwardCartonsToday: number;
    totalTransactionsToday: number;
    totalTransactionsAllTime: number;
  };
}

/**
 * Retrieves stock transactions and inventory movement history for the authenticated tenant.
 * STRICT SECURITY: Restricted to OWNER and MANAGER. Rejects SR.
 */
export async function getStockTransactionsAction(filters?: {
  productId?: string;
  type?: string;
  limit?: number;
}): Promise<StockHistoryResponse> {
  const session = await getCurrentSession();
  const { distributorId } = requireTenantAccess(session as any, [
    "OWNER",
    "MANAGER",
  ]);

  try {
    const whereClause: any = {
      distributorId,
    };

    if (filters?.productId && filters.productId !== "ALL") {
      whereClause.productId = filters.productId;
    }

    if (filters?.type && filters.type !== "ALL") {
      whereClause.type = filters.type;
    }

    const rawTransactions = await prisma.stockTransaction.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            banglaName: true,
            brand: true,
            category: true,
            uomPrimary: true,
            uomSub: true,
            conversionFactor: true,
            purchaseCost: true,
            wholesalePrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let totalInwardPiecesToday = 0;
    let totalTransactionsToday = 0;

    const transactions: SanitizedStockTransaction[] = rawTransactions.map((tx) => {
      const breakdown = toCartonPieceBreakdown(
        Math.abs(tx.quantityPieces),
        tx.product.conversionFactor
      );

      const isToday = new Date(tx.createdAt) >= todayStart;
      if (isToday) {
        totalTransactionsToday++;
        if (tx.type === "PURCHASE_IN" && tx.quantityPieces > 0) {
          totalInwardPiecesToday += tx.quantityPieces;
        }
      }

      return {
        id: tx.id,
        type: tx.type,
        quantityPieces: tx.quantityPieces,
        referenceId: tx.referenceId,
        notes: tx.notes,
        createdAt: tx.createdAt,
        product: {
          id: tx.product.id,
          name: tx.product.name,
          banglaName: tx.product.banglaName,
          brand: tx.product.brand,
          category: tx.product.category,
          uomPrimary: tx.product.uomPrimary,
          uomSub: tx.product.uomSub,
          conversionFactor: tx.product.conversionFactor,
          purchaseCost: Number(tx.product.purchaseCost),
          wholesalePrice: Number(tx.product.wholesalePrice),
        },
        cartons: breakdown.cartons,
        pieces: breakdown.pieces,
        isPositive: tx.quantityPieces > 0,
      };
    });

    // Approximate total inward cartons today across all products
    const totalInwardCartonsToday = Math.floor(totalInwardPiecesToday / 24);

    return {
      success: true,
      transactions,
      metrics: {
        totalInwardCartonsToday,
        totalTransactionsToday,
        totalTransactionsAllTime: rawTransactions.length,
      },
    };
  } catch (err: any) {
    console.error("getStockTransactionsAction Error:", err);
    return {
      success: false,
      error: err.message || "স্টক হিস্ট্রি লোড করতে সমস্যা হয়েছে।",
      transactions: [],
      metrics: {
        totalInwardCartonsToday: 0,
        totalTransactionsToday: 0,
        totalTransactionsAllTime: 0,
      },
    };
  }
}

/**
 * Records a supplier delivery challan (Stock Inward) atomically across multiple products.
 * Increments product stock in base pieces and creates PURCHASE_IN stock transaction records.
 * STRICT SECURITY: Restricted to OWNER and MANAGER.
 */
export async function recordStockInwardAction(input: StockInwardInput) {
  const session = await getCurrentSession();
  const { distributorId } = requireTenantAccess(session as any, [
    "OWNER",
    "MANAGER",
  ]);

  if (!input.challanNumber?.trim()) {
    return { success: false, error: "কোম্পানি চালান নম্বর আবশ্যক (Challan # is required)" };
  }
  if (!input.supplierName?.trim()) {
    return { success: false, error: "সাপ্লায়ার / কোম্পানির নাম আবশ্যক (Supplier is required)" };
  }
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "ন্যূনতম একটি পণ্য চালানে অন্তর্ভুক্ত করুন" };
  }

  try {
    const challanRef = input.challanNumber.trim();
    const supplierRef = input.supplierName.trim();
    const notesRef = input.notes?.trim() || "";

    // Execute atomic transaction for all line items
    const result = await prisma.$transaction(async (tx) => {
      let totalPiecesAdded = 0;

      for (const item of input.items) {
        if (!item.productId) continue;

        const product = await tx.product.findFirst({
          where: { id: item.productId, distributorId },
        });

        if (!product) {
          throw new Error(`পণ্য আইডি ${item.productId} পাওয়া যায়নি।`);
        }

        const piecesToAdd = toTotalPieces(
          Number(item.cartonQty || 0),
          Number(item.pieceQty || 0),
          product.conversionFactor
        );

        if (piecesToAdd <= 0) {
          continue; // Skip zero quantity items
        }

        totalPiecesAdded += piecesToAdd;

        // 1. Update product stock and optionally update purchase cost
        const updateData: any = {
          currentStockPieces: { increment: piecesToAdd },
        };

        if (
          item.purchaseCostPerCarton !== undefined &&
          item.purchaseCostPerCarton > 0
        ) {
          updateData.purchaseCost = item.purchaseCostPerCarton;
        }

        await tx.product.update({
          where: { id: product.id },
          data: updateData,
        });

        // 2. Create StockTransaction audit log
        await tx.stockTransaction.create({
          data: {
            distributorId,
            productId: product.id,
            type: "PURCHASE_IN",
            quantityPieces: piecesToAdd,
            referenceId: challanRef,
            notes: `কোম্পানি চালান: ${supplierRef}${notesRef ? ` • ${notesRef}` : ""}`,
          },
        });
      }

      return { totalPiecesAdded };
    });

    revalidatePath("/inventory");
    revalidatePath("/products");
    revalidatePath("/dashboard");

    return {
      success: true,
      challanNumber: challanRef,
      totalPiecesAdded: result.totalPiecesAdded,
    };
  } catch (err: any) {
    console.error("recordStockInwardAction Error:", err);
    return {
      success: false,
      error: err.message || "চালান ইনওয়ার্ড এন্ট্রি ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Bulk imports products from parsed CSV rows.
 * Validates dual-UOM parameters, enforces tenant quota, and creates initial stock records.
 * STRICT SECURITY: Restricted to OWNER and MANAGER.
 */
export async function bulkImportProductsCSVAction(rows: CSVProductRow[]) {
  const session = await getCurrentSession();
  const { distributorId } = requireTenantAccess(session as any, [
    "OWNER",
    "MANAGER",
  ]);

  if (!rows || rows.length === 0) {
    return { success: false, error: "CSV ফাইলে কোনো ডেটা পাওয়া যায়নি।" };
  }

  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
      select: {
        maxProducts: true,
        _count: { select: { products: true } },
      },
    });

    if (!distributor) {
      return { success: false, error: "ডিস্ট্রিবিউটর অ্যাকাউন্ট পাওয়া যায়নি।" };
    }

    const currentCount = distributor._count.products;
    const availableSlots = distributor.maxProducts - currentCount;

    if (rows.length > availableSlots) {
      return {
        success: false,
        error: `আপনার প্ল্যানে আরও ${availableSlots}টি পণ্য যুক্ত করার স্থান রয়েছে, কিন্তু আপনি ${rows.length}টি পণ্য ইম্পোর্ট করতে চেয়েছেন। অনুগ্রহ করে প্ল্যান আপগ্রেড করুন বা ফাইলের সংখ্যা কমান।`,
      };
    }

    const errors: string[] = [];
    const validProductsToCreate: any[] = [];

    // Validate rows
    rows.forEach((row, idx) => {
      const lineNum = idx + 1;
      if (!row.name?.trim()) {
        errors.push(`সারি ${lineNum}: পণ্যের নাম অনুপস্থিত`);
        return;
      }
      if (!row.brand?.trim()) {
        errors.push(`সারি ${lineNum}: ব্র্যান্ড অনুপস্থিত`);
        return;
      }
      if (!row.category?.trim()) {
        errors.push(`সারি ${lineNum}: ক্যাটাগরি অনুপস্থিত`);
        return;
      }

      const conversion = Number(row.conversionFactor);
      if (isNaN(conversion) || conversion < 1) {
        errors.push(`সারি ${lineNum}: ১ কার্টনে পিস সংখ্যা ন্যূনতম ১ হতে হবে`);
        return;
      }

      const cost = Number(row.purchaseCost);
      const wholesale = Number(row.wholesalePrice);
      if (isNaN(cost) || cost < 0 || isNaN(wholesale) || wholesale < 0) {
        errors.push(`সারি ${lineNum}: মূল্য শূন্য বা ধনাত্মক সংখ্যা হতে হবে`);
        return;
      }

      const initialPieces = toTotalPieces(
        Number(row.openingStockCartons || 0),
        Number(row.openingStockPieces || 0),
        conversion
      );

      validProductsToCreate.push({
        distributorId,
        name: row.name.trim(),
        banglaName: row.banglaName?.trim() || null,
        brand: row.brand.trim(),
        category: row.category.trim(),
        uomPrimary: row.uomPrimary?.trim() || "Carton",
        uomSub: row.uomSub?.trim() || "Pcs",
        conversionFactor: Math.floor(conversion),
        purchaseCost: cost,
        wholesalePrice: wholesale,
        wholesalePiecePrice: row.wholesalePiecePrice
          ? Number(row.wholesalePiecePrice)
          : null,
        mrp: row.mrp ? Number(row.mrp) : null,
        minStockAlert: Number(row.minStockAlert) || 120,
        currentStockPieces: initialPieces,
        initialPieces,
      });
    });

    if (errors.length > 0 && validProductsToCreate.length === 0) {
      return {
        success: false,
        error: "CSV ফাইলে ত্রুটি রয়েছে। অনুগ্রহ করে চেক করে আবার চেষ্টা করুন।",
        details: errors,
      };
    }

    // Execute atomic batch creation
    const createdCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const p of validProductsToCreate) {
        const created = await tx.product.create({
          data: {
            distributorId: p.distributorId,
            name: p.name,
            banglaName: p.banglaName,
            brand: p.brand,
            category: p.category,
            uomPrimary: p.uomPrimary,
            uomSub: p.uomSub,
            conversionFactor: p.conversionFactor,
            purchaseCost: p.purchaseCost,
            wholesalePrice: p.wholesalePrice,
            wholesalePiecePrice: p.wholesalePiecePrice,
            mrp: p.mrp,
            minStockAlert: p.minStockAlert,
            currentStockPieces: p.currentStockPieces,
          },
        });

        // Record opening stock transaction if stock > 0
        if (p.initialPieces > 0) {
          await tx.stockTransaction.create({
            data: {
              distributorId,
              productId: created.id,
              type: "PURCHASE_IN",
              quantityPieces: p.initialPieces,
              referenceId: "CSV_IMPORT",
              notes: "এক্সেল/CSV প্রারম্ভিক স্টক ইম্পোর্ট (CSV Opening Stock)",
            },
          });
        }
        count++;
      }
      return count;
    });

    revalidatePath("/inventory");
    revalidatePath("/products");
    revalidatePath("/dashboard");

    return {
      success: true,
      importedCount: createdCount,
      warnings: errors.length > 0 ? errors : undefined,
    };
  } catch (err: any) {
    console.error("bulkImportProductsCSVAction Error:", err);
    return {
      success: false,
      error: err.message || "CSV ইম্পোর্ট ব্যর্থ হয়েছে।",
    };
  }
}
