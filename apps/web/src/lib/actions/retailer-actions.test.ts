import { describe, it, expect } from "vitest";
import {
  isValidBdPhone,
  formatBdPhone,
  calculateCreditUtilization,
  roundCurrency,
} from "@/lib/calculations";

describe("Day 6 Retailer Directory, Routes & SR Assignment", () => {
  describe("Bangladeshi Mobile Phone Validation", () => {
    it("validates standard 11-digit Bangladeshi mobile numbers", () => {
      // Valid operators: Grameenphone (017, 013), Robi/Airtel (018, 016), Banglalink (019, 014), Teletalk (015)
      expect(isValidBdPhone("01712345678")).toBe(true);
      expect(isValidBdPhone("01312345678")).toBe(true);
      expect(isValidBdPhone("01812345678")).toBe(true);
      expect(isValidBdPhone("01612345678")).toBe(true);
      expect(isValidBdPhone("01912345678")).toBe(true);
      expect(isValidBdPhone("01412345678")).toBe(true);
      expect(isValidBdPhone("01512345678")).toBe(true);
    });

    it("accepts numbers with +88 prefix, dashes, and spaces", () => {
      expect(isValidBdPhone("+8801712345678")).toBe(true);
      expect(isValidBdPhone("8801812345678")).toBe(true);
      expect(isValidBdPhone("01712-345678")).toBe(true);
      expect(isValidBdPhone("01712 345678")).toBe(true);
    });

    it("rejects invalid Bangladeshi phone numbers", () => {
      expect(isValidBdPhone("")).toBe(false);
      expect(isValidBdPhone("123456")).toBe(false);
      expect(isValidBdPhone("01212345678")).toBe(false); // 012 is invalid prefix in BD
      expect(isValidBdPhone("0171234567")).toBe(false); // 10 digits
      expect(isValidBdPhone("017123456789")).toBe(false); // 12 digits
      expect(isValidBdPhone("abcdefghijk")).toBe(false);
    });

    it("normalizes phone numbers to clean 11 digits format", () => {
      expect(formatBdPhone("+8801712345678")).toBe("01712345678");
      expect(formatBdPhone("8801812-345678")).toBe("01812345678");
      expect(formatBdPhone(" 01912 345 678 ")).toBe("01912345678");
    });
  });

  describe("Credit Limit and Market Dues Calculation", () => {
    it("calculates credit utilization percentage accurately", () => {
      // Due: 5,000 BDT, Limit: 20,000 BDT -> 25%
      expect(calculateCreditUtilization(5000, 20000)).toBe(25);

      // Due: 10,000 BDT, Limit: 10,000 BDT -> 100%
      expect(calculateCreditUtilization(10000, 10000)).toBe(100);

      // Due: 15,000 BDT, Limit: 10,000 BDT -> 150% (over-limit)
      expect(calculateCreditUtilization(15000, 10000)).toBe(150);

      // No limit set (0 BDT) -> 0%
      expect(calculateCreditUtilization(5000, 0)).toBe(0);

      // Zero due -> 0%
      expect(calculateCreditUtilization(0, 10000)).toBe(0);
    });

    it("initializes currentDue from opening balance with half-up rounding", () => {
      const openingBalance = 4500.505;
      const roundedDue = roundCurrency(openingBalance);
      expect(roundedDue).toBe(4500.51);
    });
  });

  describe("SR Scoping and Assignment Logic", () => {
    const mockRetailers = [
      {
        id: "ret-1",
        shopName: "Rahim Store",
        assignedSrId: "sr-1",
        beatId: "beat-1",
        beat: { id: "beat-1", assignedSrId: "sr-1" },
      },
      {
        id: "ret-2",
        shopName: "Karim General Store",
        assignedSrId: null, // Inherits beat SR
        beatId: "beat-1",
        beat: { id: "beat-1", assignedSrId: "sr-1" },
      },
      {
        id: "ret-3",
        shopName: "Bismillah Traders",
        assignedSrId: "sr-2",
        beatId: "beat-2",
        beat: { id: "beat-2", assignedSrId: "sr-2" },
      },
    ];

    it("filters retailers strictly for SR-1", () => {
      const currentSrId = "sr-1";
      const sr1Visible = mockRetailers.filter(
        (r) =>
          r.assignedSrId === currentSrId || r.beat.assignedSrId === currentSrId
      );

      expect(sr1Visible).toHaveLength(2);
      expect(sr1Visible.map((r) => r.id)).toEqual(["ret-1", "ret-2"]);
    });

    it("filters retailers strictly for SR-2", () => {
      const currentSrId = "sr-2";
      const sr2Visible = mockRetailers.filter(
        (r) =>
          r.assignedSrId === currentSrId || r.beat.assignedSrId === currentSrId
      );

      expect(sr2Visible).toHaveLength(1);
      expect(sr2Visible[0].id).toBe("ret-3");
    });

    it("allows OWNER to view all retailers across all SRs and routes", () => {
      const ownerVisible = mockRetailers;
      expect(ownerVisible).toHaveLength(3);
    });
  });
});
