import { describe, it, expect } from "vitest";
import {
  toTotalPieces,
  toCartonPieceBreakdown,
  calculateLineItemTotal,
  roundCurrency,
} from "@/lib/calculations";

describe("Product Dual-UOM Calculations & Logic", () => {
  it("accurately converts Carton + Piece inputs into base pieces", () => {
    // 5 cartons of 24 pieces each + 6 loose pieces = 126 pieces
    expect(toTotalPieces(5, 6, 24)).toBe(126);

    // 0 cartons + 10 pieces with conversion factor 12 = 10 pieces
    expect(toTotalPieces(0, 10, 12)).toBe(10);

    // 10 cartons + 0 pieces with conversion factor 48 = 480 pieces
    expect(toTotalPieces(10, 0, 48)).toBe(480);
  });

  it("accurately converts base pieces back to Carton and loose piece breakdown", () => {
    // 126 pieces with 24 pieces/carton -> 5 Cartons, 6 Pcs
    const b1 = toCartonPieceBreakdown(126, 24);
    expect(b1.cartons).toBe(5);
    expect(b1.pieces).toBe(6);

    // 50 pieces with 12 pieces/carton -> 4 Cartons, 2 Pcs
    const b2 = toCartonPieceBreakdown(50, 12);
    expect(b2.cartons).toBe(4);
    expect(b2.pieces).toBe(2);

    // 24 pieces with 24 pieces/carton -> exactly 1 Carton, 0 Pcs
    const b3 = toCartonPieceBreakdown(24, 24);
    expect(b3.cartons).toBe(1);
    expect(b3.pieces).toBe(0);
  });

  it("calculates accurate derived piece rate from wholesale carton price", () => {
    const wholesaleCartonPrice = 2400; // ৳2400 per carton
    const conversionFactor = 24;       // 24 pcs per carton
    const derivedPieceRate = roundCurrency(wholesaleCartonPrice / conversionFactor);
    expect(derivedPieceRate).toBe(100); // ৳100 per piece
  });

  it("handles fractional paisa division properly with roundCurrency", () => {
    // Carton price ৳1,150 with 16 pcs/carton: 1150 / 16 = 71.875 -> 71.88
    const derivedPieceRate = roundCurrency(1150 / 16);
    expect(derivedPieceRate).toBe(71.88);
  });

  it("computes inventory valuation correctly across dual-UOM stocks", () => {
    // Product 1: 5 cartons, 12 pcs/carton (60 pcs), cost = 1200/carton -> 100/pc. Valuation = 6000
    // Product 2: 10 cartons, 24 pcs/carton (240 pcs), cost = 2400/carton -> 100/pc. Valuation = 24000
    const p1Pieces = toTotalPieces(5, 0, 12);
    const p1CostPerPiece = 1200 / 12;
    const p1Valuation = p1Pieces * p1CostPerPiece;

    const p2Pieces = toTotalPieces(10, 0, 24);
    const p2CostPerPiece = 2400 / 24;
    const p2Valuation = p2Pieces * p2CostPerPiece;

    expect(p1Valuation + p2Valuation).toBe(30000);
  });

  it("enforces conversion factor must be >= 1", () => {
    expect(() => toTotalPieces(1, 0, 0)).toThrow("Conversion factor must be greater than zero");
    expect(() => toCartonPieceBreakdown(10, -5)).toThrow("Conversion factor must be greater than zero");
  });
});
