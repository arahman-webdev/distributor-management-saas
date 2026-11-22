import { describe, it, expect } from "vitest";
import {
  toTotalPieces,
  toCartonPieceBreakdown,
  calculateLineItemTotal,
  roundCurrency,
  validateSplitPayment,
  calculateEveningCash,
} from "./calculations";

describe("Distribo Dual-UOM Math Engine", () => {
  it("converts cartons and pieces accurately to total pieces", () => {
    // 2 cartons of Lux Soap (24 pcs/carton) + 6 loose pieces = 54 pieces
    const total = toTotalPieces(2, 6, 24);
    expect(total).toBe(54);
  });

  it("handles 0 cartons or 0 pieces cleanly", () => {
    expect(toTotalPieces(5, 0, 12)).toBe(60);
    expect(toTotalPieces(0, 7, 12)).toBe(7);
  });

  it("breaks total pieces back down into cartons and loose pieces", () => {
    // 53 pieces with factor 24 = 2 cartons + 5 loose pieces
    const breakdown = toCartonPieceBreakdown(53, 24);
    expect(breakdown.cartons).toBe(2);
    expect(breakdown.pieces).toBe(5);
  });

  it("calculates line-item price with exact 2-decimal rounding", () => {
    // Carton price: ৳1200, conversion factor: 24 -> ৳50 per piece
    // 1 carton + 12 pieces = 36 pieces * ৳50 = ৳1800
    const lineItem = calculateLineItemTotal(1, 12, 24, 1200);
    expect(lineItem.totalPieces).toBe(36);
    expect(lineItem.unitPricePerPiece).toBe(50.0);
    expect(lineItem.totalPrice).toBe(1800.0);
  });

  it("handles piece price markup overrides cleanly", () => {
    // Wholesale carton price ৳1200 (৳50/pc), but loose pieces charged at ৳52/pc
    // 2 cartons (৳2400) + 3 loose pieces (3 * 52 = ৳156) = ৳2556
    const lineItem = calculateLineItemTotal(2, 3, 24, 1200, 52);
    expect(lineItem.totalPieces).toBe(51);
    expect(lineItem.totalPrice).toBe(2556.0);
  });
});

describe("Distribo Split Payment & Credit Engine", () => {
  it("calculates split payment (Cash + bKash + Baki) and balance due", () => {
    // Current invoice: ৳5,400, Previous due: ৳14,500 -> Grand Total: ৳19,900
    // Paid today: ৳5,000 (Cash) + ৳400 (bKash) = ৳5,400
    // Remaining due: ৳14,500
    const result = validateSplitPayment(5400, 14500, 5000, 400);
    expect(result.grandTotal).toBe(19900.0);
    expect(result.totalPaid).toBe(5400.0);
    expect(result.newDue).toBe(14500.0);
    expect(result.isValid).toBe(true);
  });

  it("correctly handles zero payments (100% Credit / Pure Baki Sale)", () => {
    const result = validateSplitPayment(3200, 1000, 0, 0);
    expect(result.grandTotal).toBe(4200.0);
    expect(result.totalPaid).toBe(0.0);
    expect(result.newDue).toBe(4200.0);
    expect(result.isValid).toBe(true);
  });
});

describe("Evening Daily Closing Cash Equilibrium", () => {
  it("calculates expected net cash in hand matching the PRD formula", () => {
    // Cash from sales: ৳45,000
    // Old dues collected in cash: ৳12,500
    // Petty godown expenses (tea, labor, fuel): ৳1,200
    // Net cash: ৳56,300
    const netCash = calculateEveningCash(45000, 12500, 1200);
    expect(netCash).toBe(56300.0);
  });
});
