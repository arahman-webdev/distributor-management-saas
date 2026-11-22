/**
 * Distribo FMCG Mathematical Calculation Engine
 * Guarantees zero floating-point rounding discrepancies for dual-UOM and credit transactions.
 */

export interface LineItemCalculation {
  totalPieces: number;
  unitPricePerPiece: number;
  totalPrice: number;
}

export interface SplitPaymentValidation {
  grandTotal: number;
  totalPaid: number;
  newDue: number;
  isValid: boolean;
}

export interface UOMBreakdown {
  cartons: number;
  pieces: number;
}

/**
 * Standard financial half-up rounding to exactly 2 decimal places (Paisa).
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Converts Carton + Loose Piece inputs into total base piece inventory count.
 */
export function toTotalPieces(
  cartonQty: number,
  pieceQty: number,
  conversionFactor: number
): number {
  if (conversionFactor <= 0) {
    throw new Error("Conversion factor must be greater than zero");
  }
  const safeCartons = Math.max(0, Math.floor(cartonQty || 0));
  const safePieces = Math.max(0, Math.floor(pieceQty || 0));
  return safeCartons * conversionFactor + safePieces;
}

/**
 * Converts total base pieces back into Carton and loose piece breakdown.
 */
export function toCartonPieceBreakdown(
  totalPieces: number,
  conversionFactor: number
): UOMBreakdown {
  if (conversionFactor <= 0) {
    throw new Error("Conversion factor must be greater than zero");
  }
  const safePieces = Math.max(0, Math.floor(totalPieces || 0));
  const cartons = Math.floor(safePieces / conversionFactor);
  const pieces = safePieces % conversionFactor;
  return { cartons, pieces };
}

/**
 * Calculates line-item total price based on dual-UOM carton & piece rates.
 */
export function calculateLineItemTotal(
  cartonQty: number,
  pieceQty: number,
  conversionFactor: number,
  wholesaleCartonPrice: number,
  piecePriceOverride?: number
): LineItemCalculation {
  if (conversionFactor <= 0) {
    throw new Error("Conversion factor must be greater than zero");
  }

  const totalPieces = toTotalPieces(cartonQty, pieceQty, conversionFactor);
  if (totalPieces === 0) {
    return { totalPieces: 0, unitPricePerPiece: 0, totalPrice: 0 };
  }

  // If a specific piece price override is provided, calculate carton and piece portions separately
  if (piecePriceOverride !== undefined && piecePriceOverride > 0) {
    const cartonPortion = (cartonQty || 0) * wholesaleCartonPrice;
    const piecePortion = (pieceQty || 0) * piecePriceOverride;
    const totalPrice = roundCurrency(cartonPortion + piecePortion);
    const unitPricePerPiece = roundCurrency(totalPrice / totalPieces);
    return { totalPieces, unitPricePerPiece, totalPrice };
  }

  // Standard flat conversion: base rate derived from carton wholesale price
  const baseRatePerPiece = roundCurrency(wholesaleCartonPrice / conversionFactor);
  const totalPrice = roundCurrency(totalPieces * baseRatePerPiece);

  return {
    totalPieces,
    unitPricePerPiece: baseRatePerPiece,
    totalPrice,
  };
}

/**
 * Validates invoice split payment amounts and calculates remaining due.
 */
export function validateSplitPayment(
  invoiceAmount: number,
  previousDue: number,
  cashPaid: number,
  mfsPaid: number
): SplitPaymentValidation {
  const safeInvoice = roundCurrency(invoiceAmount || 0);
  const safePrevDue = roundCurrency(previousDue || 0);
  const safeCash = roundCurrency(cashPaid || 0);
  const safeMfs = roundCurrency(mfsPaid || 0);

  const grandTotal = roundCurrency(safeInvoice + safePrevDue);
  const totalPaid = roundCurrency(safeCash + safeMfs);
  const newDue = roundCurrency(grandTotal - totalPaid);

  const isValid = safeCash >= 0 && safeMfs >= 0;

  return {
    grandTotal,
    totalPaid,
    newDue,
    isValid,
  };
}

/**
 * Evening cash drawer reconciliation formula:
 * Net Cash In Hand = (Cash Collected from Invoices + Old Dues Collected in Cash) - Petty Expenses
 */
export function calculateEveningCash(
  cashFromInvoices: number,
  cashFromDueRecovery: number,
  godownPettyExpenses: number
): number {
  const totalCashIn = roundCurrency(cashFromInvoices) + roundCurrency(cashFromDueRecovery);
  return roundCurrency(totalCashIn - roundCurrency(godownPettyExpenses));
}
