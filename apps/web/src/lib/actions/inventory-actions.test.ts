import { describe, it, expect } from "vitest";
import { toTotalPieces, toCartonPieceBreakdown } from "@/lib/calculations";

describe("Day 5 Inventory & Stock-Inward Math", () => {
  it("computes multi-item challan inward pieces accurately", () => {
    // Challan with 3 items:
    // Item 1: 10 cartons, 24 pcs/ctn + 0 pcs = 240 pcs
    // Item 2: 5 cartons, 12 pcs/ctn + 6 pcs = 66 pcs
    // Item 3: 20 cartons, 48 pcs/ctn + 12 pcs = 972 pcs
    const item1Pieces = toTotalPieces(10, 0, 24);
    const item2Pieces = toTotalPieces(5, 6, 12);
    const item3Pieces = toTotalPieces(20, 12, 48);

    expect(item1Pieces).toBe(240);
    expect(item2Pieces).toBe(66);
    expect(item3Pieces).toBe(972);

    const totalChallanPieces = item1Pieces + item2Pieces + item3Pieces;
    expect(totalChallanPieces).toBe(1278);
  });

  it("converts incoming quantities back to Dual-UOM cartons and pieces", () => {
    const breakdown1 = toCartonPieceBreakdown(240, 24);
    expect(breakdown1.cartons).toBe(10);
    expect(breakdown1.pieces).toBe(0);

    const breakdown2 = toCartonPieceBreakdown(66, 12);
    expect(breakdown2.cartons).toBe(5);
    expect(breakdown2.pieces).toBe(6);

    const breakdown3 = toCartonPieceBreakdown(972, 48);
    expect(breakdown3.cartons).toBe(20);
    expect(breakdown3.pieces).toBe(12);
  });

  it("validates CSV product row requirements", () => {
    const validateCSVRow = (row: any) => {
      const errors: string[] = [];
      if (!row.name?.trim()) errors.push("Missing name");
      if (!row.brand?.trim()) errors.push("Missing brand");
      if (!row.category?.trim()) errors.push("Missing category");
      if (isNaN(row.conversionFactor) || row.conversionFactor < 1) {
        errors.push("Invalid conversion factor");
      }
      if (isNaN(row.purchaseCost) || row.purchaseCost < 0) {
        errors.push("Invalid cost");
      }
      if (isNaN(row.wholesalePrice) || row.wholesalePrice < 0) {
        errors.push("Invalid wholesale price");
      }
      return { isValid: errors.length === 0, errors };
    };

    // Valid row
    const valid = validateCSVRow({
      name: "Pran Mustard Oil 500ml",
      brand: "PRAN",
      category: "Edible Oil",
      conversionFactor: 24,
      purchaseCost: 2000,
      wholesalePrice: 2400,
    });
    expect(valid.isValid).toBe(true);
    expect(valid.errors.length).toBe(0);

    // Invalid row (conversion factor 0, negative price)
    const invalid = validateCSVRow({
      name: "",
      brand: "PRAN",
      category: "Oil",
      conversionFactor: 0,
      purchaseCost: -100,
      wholesalePrice: 2400,
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors).toContain("Missing name");
    expect(invalid.errors).toContain("Invalid conversion factor");
    expect(invalid.errors).toContain("Invalid cost");
  });
});
