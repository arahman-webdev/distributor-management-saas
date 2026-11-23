import { describe, it, expect } from "vitest";
import {
  getFilteredNavItems,
  getFilteredQuickActions,
  ALL_NAV_ITEMS,
} from "./rbac-navigation";

describe("RBAC Navigation & Action Filtering", () => {
  it("grants OWNER full access to all 8 navigation modules", () => {
    const ownerNav = getFilteredNavItems("OWNER");
    expect(ownerNav.length).toBe(8);
    const ids = ownerNav.map((i) => i.id);
    expect(ids).toContain("settings");
    expect(ids).toContain("closing");
    expect(ids).toContain("inventory");
    expect(ids).toContain("products");
  });

  it("restricts MANAGER from settings", () => {
    const mgrNav = getFilteredNavItems("MANAGER");
    expect(mgrNav.length).toBe(7);
    const ids = mgrNav.map((i) => i.id);
    expect(ids).not.toContain("settings");
    expect(ids).toContain("closing");
    expect(ids).toContain("inventory");
  });

  it("strictly limits SR to field-relevant routes", () => {
    const srNav = getFilteredNavItems("SR");
    expect(srNav.length).toBe(4);
    const ids = srNav.map((i) => i.id);
    expect(ids).toEqual(["dashboard", "pos", "retailers", "khata"]);
    expect(ids).not.toContain("products");
    expect(ids).not.toContain("inventory");
    expect(ids).not.toContain("closing");
    expect(ids).not.toContain("settings");
  });

  it("filters quick actions appropriately per role", () => {
    const ownerActions = getFilteredQuickActions("OWNER");
    expect(ownerActions.length).toBe(5);

    const srActions = getFilteredQuickActions("SR");
    expect(srActions.length).toBe(3);
    const srActionIds = srActions.map((a) => a.id);
    expect(srActionIds).toContain("qa-pos");
    expect(srActionIds).toContain("qa-due");
    expect(srActionIds).toContain("qa-retailer");
    expect(srActionIds).not.toContain("qa-stock");
    expect(srActionIds).not.toContain("qa-expense");
  });

  it("returns empty arrays for null or undefined roles", () => {
    expect(getFilteredNavItems(null)).toEqual([]);
    expect(getFilteredQuickActions(undefined)).toEqual([]);
  });
});
