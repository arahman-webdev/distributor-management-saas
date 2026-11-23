"use server";

import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import { requireTenantAccess } from "@distribo/auth";
import {
  roundCurrency,
  toTotalPieces,
  toCartonPieceBreakdown,
  calculateLineItemTotal,
  validateSplitPayment,
} from "@/lib/calculations";
import { revalidatePath } from "next/cache";

// -------------------------------------------------------------
// TYPES & INTERFACES
// -------------------------------------------------------------

export interface CartLineItem {
  productId: string;
  productName: string;
  banglaName?: string | null;
  brand: string;
  category: string;
  uomPrimary: string;
  uomSub: string;
  conversionFactor: number;
  cartonQty: number;
  pieceQty: number;
  wholesaleCartonPrice: number;
  wholesalePiecePrice?: number | null;
  totalPieces: number;
  unitPricePerPiece: number;
  totalPrice: number;
  availableStockPieces: number;
}

export interface CreateInvoiceInput {
  retailerId: string;
  items: Array<{
    productId: string;
    cartonQty: number;
    pieceQty: number;
  }>;
  discount?: number;
  cashPaid?: number;
  mfsPaid?: number;
  mfsProvider?: string;
  notes?: string;
}

export interface POSProductItem {
  id: string;
  name: string;
  banglaName: string | null;
  brand: string;
  category: string;
  uomPrimary: string;
  uomSub: string;
  conversionFactor: number;
  wholesalePrice: number;
  wholesalePiecePrice: number | null;
  mrp: number | null;
  currentStockPieces: number;
  stockCartons: number;
  stockPieces: number;
  derivedPieceRate: number;
}

export interface POSRetailerItem {
  id: string;
  shopName: string;
  ownerName: string | null;
  phone: string;
  address: string | null;
  creditLimit: number;
  currentDue: number;
  beatName: string | null;
  assignedSrId: string | null;
  assignedSrName: string | null;
}

export interface CompletedThermalInvoice {
  id: string;
  invoiceNumber: string;
  createdAt: Date;
  status: string;

  // Distributor Info
  distributorName: string;
  receiptHeader: string | null;
  depotPhone: string;
  depotAddress: string;

  // Retailer Info
  retailer: {
    id: string;
    shopName: string;
    ownerName: string | null;
    phone: string;
    address: string | null;
    creditLimit: number;
    beatName: string | null;
  };

  // Creator Info
  createdByName: string;
  createdByRole: string;

  // Line Items
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    banglaName: string | null;
    uomPrimary: string;
    uomSub: string;
    conversionFactor: number;
    cartonQty: number;
    pieceQty: number;
    totalPieces: number;
    unitPricePerPiece: number;
    totalPrice: number;
  }>;

  // Financial Summary
  subtotal: number;
  discount: number;
  totalAmount: number;
  previousDue: number;
  grandTotal: number;
  paidAmount: number;
  cashAmount: number;
  mfsAmount: number;
  mfsProvider: string | null;
  dueAmount: number;
  isOverCreditLimit: boolean;
  creditLimit: number;
}

export interface POSInitData {
  products: POSProductItem[];
  retailers: POSRetailerItem[];
  userRole: string;
  userName: string;
  distributorName: string;
  depotPhone: string;
  depotAddress: string;
  receiptHeader: string | null;
}

// -------------------------------------------------------------
// POS DATA FETCHING
// -------------------------------------------------------------

/**
 * Initializes all required data for the POS billing terminal:
 * - Products with live carton+piece stock
 * - Retailers (scoped to SR if role is SR)
 * - Distributor receipt details
 */
export async function getPOSInitDataAction(): Promise<{
  success: boolean;
  error?: string;
  data?: POSInitData;
}> {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any,
    ["OWNER", "MANAGER", "SR"]
  );

  const role = sessionUser.distributorRole || "SR";
  const isSR = role === "SR";

  try {
    // 1. Fetch distributor details
    const distributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
      select: {
        name: true,
        phone: true,
        address: true,
        receiptHeader: true,
      },
    });

    if (!distributor) {
      return { success: false, error: "ডিস্ট্রিবিউটর অ্যাকাউন্ট পাওয়া যায়নি।" };
    }

    // 2. Fetch active products
    const rawProducts = await prisma.product.findMany({
      where: { distributorId },
      select: {
        id: true,
        name: true,
        banglaName: true,
        brand: true,
        category: true,
        uomPrimary: true,
        uomSub: true,
        conversionFactor: true,
        wholesalePrice: true,
        wholesalePiecePrice: true,
        mrp: true,
        currentStockPieces: true,
      },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    });

    const products: POSProductItem[] = rawProducts.map((p) => {
      const conv = p.conversionFactor;
      const curStock = p.currentStockPieces;
      const breakdown = toCartonPieceBreakdown(curStock, conv);
      const cartonPrice = Number(p.wholesalePrice);
      const pieceOverride = p.wholesalePiecePrice ? Number(p.wholesalePiecePrice) : null;
      const derivedPieceRate = pieceOverride || roundCurrency(cartonPrice / conv);

      return {
        id: p.id,
        name: p.name,
        banglaName: p.banglaName,
        brand: p.brand,
        category: p.category,
        uomPrimary: p.uomPrimary,
        uomSub: p.uomSub,
        conversionFactor: conv,
        wholesalePrice: cartonPrice,
        wholesalePiecePrice: pieceOverride,
        mrp: p.mrp ? Number(p.mrp) : null,
        currentStockPieces: curStock,
        stockCartons: breakdown.cartons,
        stockPieces: breakdown.pieces,
        derivedPieceRate,
      };
    });

    // 3. Fetch active retailers (SR scoped vs Owner/Manager)
    const retailerWhere: any = {
      distributorId,
      isActive: true,
    };

    if (isSR) {
      retailerWhere.OR = [
        { assignedSrId: sessionUser.id },
        { beat: { assignedSrId: sessionUser.id } },
      ];
    }

    const rawRetailers = await prisma.retailer.findMany({
      where: retailerWhere,
      include: {
        beat: { select: { name: true } },
        assignedSr: { select: { id: true, name: true } },
      },
      orderBy: { shopName: "asc" },
    });

    const retailers: POSRetailerItem[] = rawRetailers.map((r) => ({
      id: r.id,
      shopName: r.shopName,
      ownerName: r.ownerName,
      phone: r.phone,
      address: r.address,
      creditLimit: Number(r.creditLimit),
      currentDue: Number(r.currentDue),
      beatName: r.beat?.name || null,
      assignedSrId: r.assignedSrId,
      assignedSrName: r.assignedSr?.name || null,
    }));

    return {
      success: true,
      data: {
        products,
        retailers,
        userRole: role,
        userName: sessionUser.name,
        distributorName: distributor.name,
        depotPhone: distributor.phone,
        depotAddress: distributor.address,
        receiptHeader: distributor.receiptHeader,
      },
    };
  } catch (err: any) {
    console.error("getPOSInitDataAction Error:", err);
    return {
      success: false,
      error: err.message || "পিওএস টার্মিনাল ডাটা লোড করতে ব্যর্থ হয়েছে।",
    };
  }
}

// -------------------------------------------------------------
// ATOMIC INVOICE CREATION ACTION
// -------------------------------------------------------------

/**
 * Creates an invoice atomically with:
 * 1. Strict stock verification & atomic piece deduction.
 * 2. SALE_OUT stock transactions.
 * 3. Split payment validation (Cash + MFS + Baki).
 * 4. Money receipts (PaymentTransaction) for paid amounts.
 * 5. Automatic retailer currentDue adjustment.
 * 6. Returns complete formatted invoice for immediate thermal memo printing.
 */
export async function createInvoiceAction(input: CreateInvoiceInput): Promise<{
  success: boolean;
  error?: string;
  invoice?: CompletedThermalInvoice;
}> {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any,
    ["OWNER", "MANAGER", "SR"]
  );

  const role = sessionUser.distributorRole || "SR";
  const isSR = role === "SR";

  if (!input.retailerId) {
    return { success: false, error: "অনুগ্রহ করে দোকানদার (Retailer) নির্বাচন করুন।" };
  }

  if (!input.items || input.items.length === 0) {
    return { success: false, error: "ইনভয়েসে কমপক্ষে একটি পণ্য যুক্ত করতে হবে।" };
  }

  try {
    // 1. Fetch Retailer & verify access
    const retailer = await prisma.retailer.findFirst({
      where: {
        id: input.retailerId,
        distributorId,
        isActive: true,
      },
      include: {
        beat: { select: { name: true, assignedSrId: true } },
      },
    });

    if (!retailer) {
      return { success: false, error: "নির্বাচিত দোকানদার পাওয়া যায়নি বা নিষ্ক্রিয় রয়েছে।" };
    }

    // Role-based verification: SR cannot bill unassigned retailers
    if (isSR) {
      const isDirectlyAssigned = retailer.assignedSrId === sessionUser.id;
      const isBeatAssigned = retailer.beat?.assignedSrId === sessionUser.id;
      if (!isDirectlyAssigned && !isBeatAssigned) {
        return {
          success: false,
          error: "আপনি শুধুমাত্র আপনার জন্য নির্ধারিত দোকানসমূহে বিল তৈরি করতে পারবেন।",
        };
      }
    }

    // 2. Fetch Products and validate requested quantities
    const productIds = input.items.map((i) => i.productId);
    const productsInDb = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        distributorId,
      },
    });

    const productMap = new Map(productsInDb.map((p) => [p.id, p]));

    // Validate and calculate line items
    let subtotal = 0;
    const computedItems: Array<{
      productId: string;
      productName: string;
      banglaName: string | null;
      uomPrimary: string;
      uomSub: string;
      conversionFactor: number;
      cartonQty: number;
      pieceQty: number;
      totalPieces: number;
      unitPricePerPiece: number;
      totalPrice: number;
    }> = [];

    for (const item of input.items) {
      const p = productMap.get(item.productId);
      if (!p) {
        return {
          success: false,
          error: `পণ্য (ID: ${item.productId}) খুঁজে পাওয়া যায়নি।`,
        };
      }

      const cartonQty = Math.max(0, Math.floor(Number(item.cartonQty) || 0));
      const pieceQty = Math.max(0, Math.floor(Number(item.pieceQty) || 0));
      const totalPieces = toTotalPieces(cartonQty, pieceQty, p.conversionFactor);

      if (totalPieces <= 0) {
        return {
          success: false,
          error: `"${p.name}" পণ্যের পরিমাণ কমপক্ষে ১ পিস বা ১ কার্টন হতে হবে।`,
        };
      }

      // Check stock sufficiency
      if (p.currentStockPieces < totalPieces) {
        const available = toCartonPieceBreakdown(p.currentStockPieces, p.conversionFactor);
        return {
          success: false,
          error: `"${p.name}" পণ্যের পর্যাপ্ত স্টক নেই! বর্তমানে মজুদ: ${available.cartons} কার্টন ${available.pieces} পিস (মোট ${p.currentStockPieces} পিস)।`,
        };
      }

      const wholesaleCarton = Number(p.wholesalePrice);
      const pieceOverride = p.wholesalePiecePrice ? Number(p.wholesalePiecePrice) : undefined;
      const lineCalc = calculateLineItemTotal(
        cartonQty,
        pieceQty,
        p.conversionFactor,
        wholesaleCarton,
        pieceOverride
      );

      subtotal += lineCalc.totalPrice;

      computedItems.push({
        productId: p.id,
        productName: p.name,
        banglaName: p.banglaName,
        uomPrimary: p.uomPrimary,
        uomSub: p.uomSub,
        conversionFactor: p.conversionFactor,
        cartonQty,
        pieceQty,
        totalPieces,
        unitPricePerPiece: lineCalc.unitPricePerPiece,
        totalPrice: lineCalc.totalPrice,
      });
    }

    subtotal = roundCurrency(subtotal);

    // 3. Discount, totals & split payment calculation
    const discount = Math.max(0, roundCurrency(Number(input.discount) || 0));
    const totalAmount = Math.max(0, roundCurrency(subtotal - discount));
    const previousDue = roundCurrency(Number(retailer.currentDue));
    const grandTotal = roundCurrency(totalAmount + previousDue);

    const cashPaid = Math.max(0, roundCurrency(Number(input.cashPaid) || 0));
    const mfsPaid = Math.max(0, roundCurrency(Number(input.mfsPaid) || 0));
    const mfsProvider = input.mfsProvider?.trim() || null;

    const paymentVal = validateSplitPayment(totalAmount, previousDue, cashPaid, mfsPaid);
    const paidAmount = paymentVal.totalPaid;
    const newDue = paymentVal.newDue;

    const creditLimit = roundCurrency(Number(retailer.creditLimit));
    const isOverCreditLimit = creditLimit > 0 && newDue > creditLimit;

    // 4. Generate sequential Invoice Number and MR Number
    const year = new Date().getFullYear();
    const invPrefix = `INV-${year}-`;
    const mrPrefix = `MR-${year}-`;

    const [latestInv, latestMr, distributor] = await Promise.all([
      prisma.invoice.findFirst({
        where: { distributorId, invoiceNumber: { startsWith: invPrefix } },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      }),
      prisma.paymentTransaction.findFirst({
        where: { distributorId, mrNumber: { startsWith: mrPrefix } },
        orderBy: { mrNumber: "desc" },
        select: { mrNumber: true },
      }),
      prisma.distributor.findUnique({
        where: { id: distributorId },
        select: {
          name: true,
          phone: true,
          address: true,
          receiptHeader: true,
        },
      }),
    ]);

    let nextInvSeq = 1;
    if (latestInv?.invoiceNumber) {
      const parts = latestInv.invoiceNumber.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextInvSeq = num + 1;
    }
    const invoiceNumber = `${invPrefix}${String(nextInvSeq).padStart(4, "0")}`;

    let nextMrSeq = 1;
    if (latestMr?.mrNumber) {
      const parts = latestMr.mrNumber.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextMrSeq = num + 1;
    }
    const baseMrNumber = `${mrPrefix}${String(nextMrSeq).padStart(4, "0")}`;

    // 5. Execute DB Transaction
    const completedInvoiceRecord = await prisma.$transaction(async (tx) => {
      // 5a. Create Invoice
      const inv = await tx.invoice.create({
        data: {
          distributorId,
          retailerId: retailer.id,
          invoiceNumber,
          subtotal,
          discount,
          totalAmount,
          previousDue,
          grandTotal,
          paidAmount,
          cashAmount: cashPaid,
          mfsAmount: mfsPaid,
          mfsProvider,
          dueAmount: newDue,
          status: "COMPLETED",
          createdById: sessionUser.id,
          items: {
            create: computedItems.map((ci) => ({
              productId: ci.productId,
              cartonQty: ci.cartonQty,
              pieceQty: ci.pieceQty,
              totalPieces: ci.totalPieces,
              unitPricePerPiece: ci.unitPricePerPiece,
              totalPrice: ci.totalPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 5b. Decrement product stock & record StockTransaction (SALE_OUT)
      for (const ci of computedItems) {
        await tx.product.update({
          where: { id: ci.productId },
          data: {
            currentStockPieces: {
              decrement: ci.totalPieces,
            },
          },
        });

        await tx.stockTransaction.create({
          data: {
            distributorId,
            productId: ci.productId,
            type: "SALE_OUT",
            quantityPieces: -ci.totalPieces,
            referenceId: invoiceNumber,
            notes: `বিক্রি - ক্যাশ মেমো: ${invoiceNumber} (${retailer.shopName})`,
          },
        });
      }

      // 5c. Record Payment Transaction for Cash if any
      if (cashPaid > 0) {
        await tx.paymentTransaction.create({
          data: {
            distributorId,
            retailerId: retailer.id,
            invoiceId: inv.id,
            mrNumber: baseMrNumber,
            amount: cashPaid,
            paymentMethod: "CASH",
            notes: `ক্যাশ জমা (মেমো: ${invoiceNumber})`,
            createdById: sessionUser.id,
          },
        });
      }

      // 5d. Record Payment Transaction for MFS if any
      if (mfsPaid > 0) {
        let mfsMethod: "BKASH" | "NAGAD" | "BANK" = "BKASH";
        if (mfsProvider?.toLowerCase().includes("nagad")) {
          mfsMethod = "NAGAD";
        } else if (mfsProvider?.toLowerCase().includes("bank")) {
          mfsMethod = "BANK";
        }

        const mfsMr = cashPaid > 0 ? `${baseMrNumber}-MFS` : baseMrNumber;
        await tx.paymentTransaction.create({
          data: {
            distributorId,
            retailerId: retailer.id,
            invoiceId: inv.id,
            mrNumber: mfsMr,
            amount: mfsPaid,
            paymentMethod: mfsMethod,
            notes: `${mfsProvider || "MFS"} পেমেন্ট (মেমো: ${invoiceNumber})`,
            createdById: sessionUser.id,
          },
        });
      }

      // 5e. Update Retailer's currentDue
      await tx.retailer.update({
        where: { id: retailer.id },
        data: {
          currentDue: newDue,
        },
      });

      return inv;
    });

    revalidatePath("/pos");
    revalidatePath("/retailers");
    revalidatePath("/products");
    revalidatePath("/dashboard");
    revalidatePath("/khata");

    // 6. Assemble complete thermal memo response
    const thermalInvoice: CompletedThermalInvoice = {
      id: completedInvoiceRecord.id,
      invoiceNumber: completedInvoiceRecord.invoiceNumber,
      createdAt: completedInvoiceRecord.createdAt,
      status: completedInvoiceRecord.status,
      distributorName: distributor?.name || "ডিস্ট্রিবিউটর মেমো",
      receiptHeader: distributor?.receiptHeader || null,
      depotPhone: distributor?.phone || "",
      depotAddress: distributor?.address || "",
      retailer: {
        id: retailer.id,
        shopName: retailer.shopName,
        ownerName: retailer.ownerName,
        phone: retailer.phone,
        address: retailer.address,
        creditLimit,
        beatName: retailer.beat?.name || null,
      },
      createdByName: sessionUser.name,
      createdByRole: role,
      items: computedItems.map((ci, idx) => ({
        id: completedInvoiceRecord.items[idx]?.id || `${idx}`,
        productId: ci.productId,
        productName: ci.productName,
        banglaName: ci.banglaName,
        uomPrimary: ci.uomPrimary,
        uomSub: ci.uomSub,
        conversionFactor: ci.conversionFactor,
        cartonQty: ci.cartonQty,
        pieceQty: ci.pieceQty,
        totalPieces: ci.totalPieces,
        unitPricePerPiece: ci.unitPricePerPiece,
        totalPrice: ci.totalPrice,
      })),
      subtotal,
      discount,
      totalAmount,
      previousDue,
      grandTotal,
      paidAmount,
      cashAmount: cashPaid,
      mfsAmount: mfsPaid,
      mfsProvider,
      dueAmount: newDue,
      isOverCreditLimit,
      creditLimit,
    };

    return {
      success: true,
      invoice: thermalInvoice,
    };
  } catch (err: any) {
    console.error("createInvoiceAction Error:", err);
    return {
      success: false,
      error: err.message || "ক্যাশ মেমো তৈরি করতে ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Retrieves past invoices for the distributor.
 * SRs can view their own generated invoices; Owners/Managers view all invoices.
 */
export async function getInvoicesHistoryAction(limit = 20): Promise<{
  success: boolean;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    shopName: string;
    retailerPhone: string;
    createdByName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    createdAt: Date;
  }>;
}> {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any,
    ["OWNER", "MANAGER", "SR"]
  );

  const role = sessionUser.distributorRole || "SR";
  const isSR = role === "SR";

  try {
    const where: any = { distributorId };
    if (isSR) {
      where.createdById = sessionUser.id;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        retailer: {
          select: { shopName: true, phone: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
    });

    return {
      success: true,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        shopName: inv.retailer.shopName,
        retailerPhone: inv.retailer.phone,
        createdByName: inv.createdBy?.name || "অজানা",
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        dueAmount: Number(inv.dueAmount),
        status: inv.status,
        createdAt: inv.createdAt,
      })),
    };
  } catch (err: any) {
    console.error("getInvoicesHistoryAction Error:", err);
    return { success: false, invoices: [] };
  }
}
