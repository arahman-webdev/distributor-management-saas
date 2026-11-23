"use server";

import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import { requireTenantAccess, AuthorizationError } from "@distribo/auth";
import {
  toTotalPieces,
  toCartonPieceBreakdown,
  roundCurrency,
} from "@/lib/calculations";
import { revalidatePath } from "next/cache";

export interface ProductFilterParams {
  search?: string;
  category?: string;
  brand?: string;
  lowStockOnly?: boolean;
}

export interface CreateProductInput {
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
  initialStockCartons?: number;
  initialStockPieces?: number;
}

export interface UpdateProductInput {
  name: string;
  banglaName?: string;
  brand: string;
  category: string;
  uomPrimary?: string;
  uomSub?: string;
  conversionFactor: number;
  purchaseCost?: number;
  wholesalePrice: number;
  wholesalePiecePrice?: number;
  mrp?: number;
  minStockAlert?: number;
}

export interface SanitizedProduct {
  id: string;
  distributorId: string;
  name: string;
  banglaName: string | null;
  brand: string;
  category: string;
  uomPrimary: string;
  uomSub: string;
  conversionFactor: number;
  purchaseCost: number | null; // Hidden from SR
  wholesalePrice: number;
  wholesalePiecePrice: number | null;
  mrp: number | null;
  minStockAlert: number;
  currentStockPieces: number;
  stockCartons: number;
  stockRemainingPieces: number;
  isLowStock: boolean;
  derivedPieceRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCatalogResponse {
  success: boolean;
  error?: string;
  role: string;
  products: SanitizedProduct[];
  categories: string[];
  brands: string[];
  metrics: {
    totalProducts: number;
    lowStockCount: number;
    totalStockPieces: number;
    inventoryValuation: number | null; // Hidden from SR
  };
}

/**
 * Retrieves products for the authenticated distributor tenant with strict role-based data sanitization.
 * Enforces: SRs CANNOT view purchase cost or depot inventory valuation.
 */
export async function getProductsAction(
  filters?: ProductFilterParams
): Promise<ProductCatalogResponse> {
  const session = await getCurrentSession();
  const { distributorId, role } = requireTenantAccess(session as any, [
    "OWNER",
    "MANAGER",
    "SR",
  ]);

  const isSR = role === "SR";

  try {
    // Build filter conditions
    const whereClause: any = {
      distributorId,
    };

    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { banglaName: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filters?.category && filters.category !== "ALL") {
      whereClause.category = filters.category;
    }

    if (filters?.brand && filters.brand !== "ALL") {
      whereClause.brand = filters.brand;
    }

    const rawProducts = await prisma.product.findMany({
      where: whereClause,
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    });

    let totalValuation = 0;
    let lowStockCount = 0;
    let totalStockPieces = 0;

    const categoriesSet = new Set<string>();
    const brandsSet = new Set<string>();

    const sanitizedProducts: SanitizedProduct[] = rawProducts
      .map((p) => {
        categoriesSet.add(p.category);
        brandsSet.add(p.brand);

        const breakdown = toCartonPieceBreakdown(
          p.currentStockPieces,
          p.conversionFactor
        );
        const isLow = p.currentStockPieces <= p.minStockAlert;

        if (isLow) lowStockCount++;
        totalStockPieces += p.currentStockPieces;

        const purchaseCostNum = Number(p.purchaseCost);
        const wholesalePriceNum = Number(p.wholesalePrice);
        const wholesalePiecePriceNum = p.wholesalePiecePrice
          ? Number(p.wholesalePiecePrice)
          : null;
        const mrpNum = p.mrp ? Number(p.mrp) : null;

        // Valuation: calculated per piece of purchase cost
        const pieceCost = purchaseCostNum / p.conversionFactor;
        totalValuation += p.currentStockPieces * pieceCost;

        // Derived piece rate for sales
        const derivedPieceRate =
          wholesalePiecePriceNum ||
          roundCurrency(wholesalePriceNum / p.conversionFactor);

        return {
          id: p.id,
          distributorId: p.distributorId,
          name: p.name,
          banglaName: p.banglaName,
          brand: p.brand,
          category: p.category,
          uomPrimary: p.uomPrimary,
          uomSub: p.uomSub,
          conversionFactor: p.conversionFactor,
          // STRICT SECURITY: SR cannot see purchase cost
          purchaseCost: isSR ? null : purchaseCostNum,
          wholesalePrice: wholesalePriceNum,
          wholesalePiecePrice: wholesalePiecePriceNum,
          mrp: mrpNum,
          minStockAlert: p.minStockAlert,
          currentStockPieces: p.currentStockPieces,
          stockCartons: breakdown.cartons,
          stockRemainingPieces: breakdown.pieces,
          isLowStock: isLow,
          derivedPieceRate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
      .filter((p) => (filters?.lowStockOnly ? p.isLowStock : true));

    return {
      success: true,
      role,
      products: sanitizedProducts,
      categories: Array.from(categoriesSet).sort(),
      brands: Array.from(brandsSet).sort(),
      metrics: {
        totalProducts: rawProducts.length,
        lowStockCount,
        totalStockPieces,
        inventoryValuation: isSR ? null : roundCurrency(totalValuation),
      },
    };
  } catch (err: any) {
    console.error("getProductsAction Error:", err);
    return {
      success: false,
      error: err.message || "পণ্য তালিকা লোড করতে সমস্যা হয়েছে।",
      role,
      products: [],
      categories: [],
      brands: [],
      metrics: {
        totalProducts: 0,
        lowStockCount: 0,
        totalStockPieces: 0,
        inventoryValuation: null,
      },
    };
  }
}

/**
 * Creates a new product catalog item with dual-UOM properties and initial stock records.
 * STRICT SECURITY: Only OWNER and MANAGER can create products.
 */
export async function createProductAction(input: CreateProductInput) {
  const session = await getCurrentSession();
  const { distributorId, role } = requireTenantAccess(session as any, [
    "OWNER",
    "MANAGER",
  ]);

  if (role === "SR") {
    throw new AuthorizationError(
      "অনুমতি নেই: সেলস রিপ্রেজেন্টেটিভ (SR) নতুন পণ্য যুক্ত করতে পারেন না।",
      403
    );
  }

  // Basic validation
  if (!input.name?.trim()) {
    return { success: false, error: "পণ্যের নাম আবশ্যক (Product name is required)" };
  }
  if (!input.brand?.trim()) {
    return { success: false, error: "ব্র্যান্ডের নাম আবশ্যক (Brand is required)" };
  }
  if (!input.category?.trim()) {
    return { success: false, error: "ক্যাটাগরি আবশ্যক (Category is required)" };
  }
  if (!input.conversionFactor || input.conversionFactor < 1) {
    return {
      success: false,
      error: "কার্টন প্রতি পিস সংখ্যা ন্যূনতম ১ হতে হবে (Conversion factor must be >= 1)",
    };
  }
  if (input.wholesalePrice === undefined || input.wholesalePrice < 0) {
    return { success: false, error: "পাইকারি মূল্য ০ বা তার বেশি হতে হবে" };
  }
  if (input.purchaseCost === undefined || input.purchaseCost < 0) {
    return { success: false, error: "ক্রয় মূল্য ০ বা তার বেশি হতে হবে" };
  }

  try {
    // Check distributor maxProducts limit
    const distributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
      select: { maxProducts: true, _count: { select: { products: true } } },
    });

    if (
      distributor &&
      distributor._count.products >= distributor.maxProducts
    ) {
      return {
        success: false,
        error: `আপনার সাবস্ক্রিপশন প্ল্যানে সর্বোচ্চ ${distributor.maxProducts}টি পণ্য তৈরি করা সম্ভব। প্ল্যান আপগ্রেড করুন।`,
      };
    }

    // Calculate initial stock in base pieces
    const initialPieces = toTotalPieces(
      input.initialStockCartons || 0,
      input.initialStockPieces || 0,
      input.conversionFactor
    );

    // Create product inside a transaction
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          distributorId,
          name: input.name.trim(),
          banglaName: input.banglaName?.trim() || null,
          brand: input.brand.trim(),
          category: input.category.trim(),
          uomPrimary: input.uomPrimary?.trim() || "Carton",
          uomSub: input.uomSub?.trim() || "Pcs",
          conversionFactor: Math.floor(input.conversionFactor),
          purchaseCost: input.purchaseCost,
          wholesalePrice: input.wholesalePrice,
          wholesalePiecePrice: input.wholesalePiecePrice || null,
          mrp: input.mrp || null,
          minStockAlert: input.minStockAlert || 120,
          currentStockPieces: initialPieces,
        },
      });

      // If initial stock was provided, write initial StockTransaction
      if (initialPieces > 0) {
        await tx.stockTransaction.create({
          data: {
            distributorId,
            productId: created.id,
            type: "PURCHASE_IN",
            quantityPieces: initialPieces,
            referenceId: "OPENING_STOCK",
            notes: "প্রারম্ভিক স্টক এন্ট্রি (Opening Stock Setup)",
          },
        });
      }

      return created;
    });

    revalidatePath("/products");
    revalidatePath("/dashboard");

    return {
      success: true,
      product,
    };
  } catch (err: any) {
    console.error("createProductAction Error:", err);
    return {
      success: false,
      error: err.message || "পণ্য তৈরি ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Updates an existing product catalog item.
 * STRICT SECURITY: Only OWNER and MANAGER can update products.
 */
export async function updateProductAction(
  id: string,
  input: UpdateProductInput
) {
  const session = await getCurrentSession();
  const { distributorId, role } = requireTenantAccess(session as any, [
    "OWNER",
    "MANAGER",
  ]);

  if (role === "SR") {
    throw new AuthorizationError(
      "অনুমতি নেই: সেলস রিপ্রেজেন্টেটিভ (SR) পণ্য পরিবর্তন করতে পারেন না।",
      403
    );
  }

  if (!input.name?.trim()) {
    return { success: false, error: "পণ্যের নাম আবশ্যক" };
  }
  if (!input.conversionFactor || input.conversionFactor < 1) {
    return { success: false, error: "কনভার্সন ফ্যাক্টর ন্যূনতম ১ হতে হবে" };
  }

  try {
    const existing = await prisma.product.findFirst({
      where: { id, distributorId },
    });

    if (!existing) {
      return { success: false, error: "পণ্যটি খুঁজে পাওয়া যায়নি।" };
    }

    const updateData: any = {
      name: input.name.trim(),
      banglaName: input.banglaName?.trim() || null,
      brand: input.brand.trim(),
      category: input.category.trim(),
      uomPrimary: input.uomPrimary?.trim() || "Carton",
      uomSub: input.uomSub?.trim() || "Pcs",
      conversionFactor: Math.floor(input.conversionFactor),
      wholesalePrice: input.wholesalePrice,
      wholesalePiecePrice: input.wholesalePiecePrice || null,
      mrp: input.mrp || null,
      minStockAlert: input.minStockAlert || 120,
    };

    // If purchase cost is provided (OWNER/MANAGER), update it
    if (input.purchaseCost !== undefined) {
      updateData.purchaseCost = input.purchaseCost;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/products");
    revalidatePath("/dashboard");

    return {
      success: true,
      product: updated,
    };
  } catch (err: any) {
    console.error("updateProductAction Error:", err);
    return {
      success: false,
      error: err.message || "পণ্য আপডেট ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Deletes a product catalog item.
 * STRICT SECURITY: Only OWNER can delete products. Checks for foreign key history.
 */
export async function deleteProductAction(id: string) {
  const session = await getCurrentSession();
  const { distributorId, role } = requireTenantAccess(session as any, [
    "OWNER",
  ]);

  if (role !== "OWNER") {
    throw new AuthorizationError(
      "অনুমতি নেই: শুধুমাত্র বিজনেস ওনার (Owner) পণ্য মুছে ফেলতে পারেন।",
      403
    );
  }

  try {
    const existing = await prisma.product.findFirst({
      where: { id, distributorId },
      include: {
        _count: {
          select: {
            invoiceItems: true,
            stockTransactions: true,
          },
        },
      },
    });

    if (!existing) {
      return { success: false, error: "পণ্যটি খুঁজে পাওয়া যায়নি।" };
    }

    if (existing._count.invoiceItems > 0) {
      return {
        success: false,
        error: `এই পণ্যটির পূর্বের ${existing._count.invoiceItems}টি বিক্রয় মেমো রয়েছে। অডিট ও হিসাবের সুরক্ষার জন্য পণ্যটি মুছে ফেলা সম্ভব নয়।`,
      };
    }

    // Delete stock transactions if any
    await prisma.$transaction(async (tx) => {
      await tx.stockTransaction.deleteMany({
        where: { productId: id },
      });
      await tx.product.delete({
        where: { id },
      });
    });

    revalidatePath("/products");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    console.error("deleteProductAction Error:", err);
    return {
      success: false,
      error: err.message || "পণ্য মুছে ফেলতে সমস্যা হয়েছে।",
    };
  }
}
