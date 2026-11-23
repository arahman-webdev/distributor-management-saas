import { describe, it, expect } from "vitest";
import {
  calculateLineItemTotal,
  toTotalPieces,
  toCartonPieceBreakdown,
  validateSplitPayment,
  roundCurrency,
  calculateCreditUtilization,
} from "@/lib/calculations";

describe("Day 7 POS Billing, Split Payment & Inventory Math", () => {
  describe("Dual-UOM Line Item Calculations", () => {
    it("computes standard carton and piece pricing accurately", () => {
      // 2 Cartons + 6 Pieces of Biscuit (Conversion Factor: 24 pcs/ctn, ৳1,200/ctn)
      // Unit price per piece = 1200 / 24 = 50.00
      // Total pieces = 2 * 24 + 6 = 54 pieces
      // Total price = 54 * 50 = 2,700.00
      const result = calculateLineItemTotal(2, 6, 24, 1200);

      expect(result.totalPieces).toBe(54);
      expect(result.unitPricePerPiece).toBe(50);
      expect(result.totalPrice).toBe(2700);
    });

    it("handles custom piece price override if set", () => {
      // 1 Carton (৳2,400) + 4 Pieces (piece override: ৳110 each, conversion factor: 24)
      // Carton portion: 1 * 2400 = 2400
      // Piece portion: 4 * 110 = 440
      // Total = 2840. Total pieces = 28. Unit price = 2840 / 28 = 101.43
      const result = calculateLineItemTotal(1, 4, 24, 2400, 110);

      expect(result.totalPieces).toBe(28);
      expect(result.totalPrice).toBe(2840);
      expect(result.unitPricePerPiece).toBe(101.43);
    });

    it("verifies zero quantities return zero total", () => {
      const result = calculateLineItemTotal(0, 0, 24, 1200);
      expect(result.totalPieces).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  describe("Split Payment Math (Cash + MFS + Baki)", () => {
    it("calculates partial cash + MFS payment with previous due accurately", () => {
      // Current invoice subtotal: ৳4,500
      // Previous shop due (baki): ৳2,000
      // Grand total = ৳6,500
      // Paid in Cash: ৳3,000
      // Paid via bKash: ৳1,500
      // Total paid: ৳4,500
      // New remaining due: ৳6,500 - ৳4,500 = ৳2,000
      const payment = validateSplitPayment(4500, 2000, 3000, 1500);

      expect(payment.grandTotal).toBe(6500);
      expect(payment.totalPaid).toBe(4500);
      expect(payment.newDue).toBe(2000);
      expect(payment.isValid).toBe(true);
    });

    it("handles full cash settlement of bill and past due", () => {
      // Bill: ৳3,200, Previous Due: ৳800, Paid: ৳4,000 cash, ৳0 MFS
      const payment = validateSplitPayment(3200, 800, 4000, 0);

      expect(payment.grandTotal).toBe(4000);
      expect(payment.totalPaid).toBe(4000);
      expect(payment.newDue).toBe(0);
    });

    it("handles 100% credit (baki) sale when customer pays ৳0 now", () => {
      // Bill: ৳5,000, Previous Due: ৳1,500, Paid: ৳0
      const payment = validateSplitPayment(5000, 1500, 0, 0);

      expect(payment.grandTotal).toBe(6500);
      expect(payment.totalPaid).toBe(0);
      expect(payment.newDue).toBe(6500);
    });
  });

  describe("Stock Sufficiency Verification", () => {
    it("detects when requested quantity exceeds available stock pieces", () => {
      const currentStockPieces = 50; // e.g., 2 cartons and 2 pieces (conv: 24)
      const requestedCartons = 2;
      const requestedPieces = 10; // requested = 2*24 + 10 = 58 pieces

      const requestedTotal = toTotalPieces(requestedCartons, requestedPieces, 24);
      expect(requestedTotal).toBe(58);

      const hasSufficientStock = currentStockPieces >= requestedTotal;
      expect(hasSufficientStock).toBe(false);
    });

    it("passes when depot stock has exact or surplus pieces", () => {
      const currentStockPieces = 120; // 5 cartons
      const requestedCartons = 4;
      const requestedPieces = 12; // 4*24 + 12 = 108 pieces

      const requestedTotal = toTotalPieces(requestedCartons, requestedPieces, 24);
      expect(requestedTotal).toBe(108);

      const hasSufficientStock = currentStockPieces >= requestedTotal;
      expect(hasSufficientStock).toBe(true);
      expect(currentStockPieces - requestedTotal).toBe(12);
    });
  });

  describe("Credit Limit Warning Rules", () => {
    it("flags over-limit when new due exceeds retailer credit limit", () => {
      const creditLimit = 10000;
      const newDue = 12500;

      const isOverLimit = creditLimit > 0 && newDue > creditLimit;
      expect(isOverLimit).toBe(true);

      const utilization = calculateCreditUtilization(newDue, creditLimit);
      expect(utilization).toBe(125);
    });

    it("does not flag warning when new due is within credit limit", () => {
      const creditLimit = 10000;
      const newDue = 8000;

      const isOverLimit = creditLimit > 0 && newDue > creditLimit;
      expect(isOverLimit).toBe(false);

      const utilization = calculateCreditUtilization(newDue, creditLimit);
      expect(utilization).toBe(80);
    });
  });
});
