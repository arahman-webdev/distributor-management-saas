import { describe, it, expect } from "vitest";
import {
  roundCurrency,
  calculateCreditUtilization,
} from "@/lib/calculations";

describe("Day 8 Credit Ledger (Baki Khata), Payment Collection & Dokan Statement", () => {
  describe("Running Balance Timeline Calculation", () => {
    it("computes sequential running balance with debits and credits accurately", () => {
      const openingBalance = 2500;
      let runningBalance = openingBalance;

      const events = [
        { type: "INVOICE", amount: 3200.5 }, // Debit (+)
        { type: "PAYMENT", amount: 2000.0 }, // Credit (-)
        { type: "INVOICE", amount: 4150.25 }, // Debit (+)
        { type: "PAYMENT", amount: 5000.0 }, // Credit (-)
      ];

      const balances: number[] = [];

      for (const event of events) {
        if (event.type === "INVOICE") {
          runningBalance = roundCurrency(runningBalance + event.amount);
        } else {
          runningBalance = roundCurrency(runningBalance - event.amount);
        }
        balances.push(runningBalance);
      }

      // 2500 + 3200.50 = 5700.50
      expect(balances[0]).toBe(5700.5);
      // 5700.50 - 2000 = 3700.50
      expect(balances[1]).toBe(3700.5);
      // 3700.50 + 4150.25 = 7850.75
      expect(balances[2]).toBe(7850.75);
      // 7850.75 - 5000 = 2850.75
      expect(balances[3]).toBe(2850.75);
    });

    it("handles full clearance of customer dues to exactly ৳0.00", () => {
      const currentDue = 8450.75;
      const paymentAmount = 8450.75;

      const newDue = roundCurrency(currentDue - paymentAmount);
      expect(newDue).toBe(0);
    });

    it("handles customer advance payment when payment exceeds due", () => {
      const currentDue = 3000;
      const paymentAmount = 3500; // ৳500 advance

      const newDue = roundCurrency(currentDue - paymentAmount);
      expect(newDue).toBe(-500);
    });
  });

  describe("Credit Limit & Aging Monitoring", () => {
    it("identifies retailers exceeding approved credit limit", () => {
      const retailers = [
        { shopName: "Store A", creditLimit: 10000, currentDue: 12500 }, // Over limit
        { shopName: "Store B", creditLimit: 20000, currentDue: 15000 }, // Within limit
        { shopName: "Store C", creditLimit: 0, currentDue: 5000 }, // No limit set
        { shopName: "Store D", creditLimit: 5000, currentDue: 0 }, // Cleared
      ];

      const overLimitRetailers = retailers.filter(
        (r) => r.creditLimit > 0 && r.currentDue > r.creditLimit
      );

      expect(overLimitRetailers).toHaveLength(1);
      expect(overLimitRetailers[0].shopName).toBe("Store A");

      const utilizationA = calculateCreditUtilization(12500, 10000);
      expect(utilizationA).toBe(125);

      const utilizationB = calculateCreditUtilization(15000, 20000);
      expect(utilizationB).toBe(75);
    });
  });

  describe("SR Scoping in Payment Collection", () => {
    it("verifies SR collection permission strictly on assigned retailers", () => {
      const currentSrId = "sr-user-1";
      const retailer1 = { id: "r1", assignedSrId: "sr-user-1", beatSrId: null };
      const retailer2 = { id: "r2", assignedSrId: null, beatSrId: "sr-user-1" };
      const retailer3 = { id: "r3", assignedSrId: "sr-user-2", beatSrId: "sr-user-2" };

      const canCollect = (r: { assignedSrId: string | null; beatSrId: string | null }) =>
        r.assignedSrId === currentSrId || r.beatSrId === currentSrId;

      expect(canCollect(retailer1)).toBe(true);
      expect(canCollect(retailer2)).toBe(true);
      expect(canCollect(retailer3)).toBe(false);
    });
  });
});
