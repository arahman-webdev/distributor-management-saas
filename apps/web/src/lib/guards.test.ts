import { describe, it, expect } from "vitest";
import {
  isSuperAdmin,
  requireSuperAdmin,
  requireTenantAccess,
  requireTenantOwner,
  validateDistributorStatus,
  AuthorizationError,
} from "@distribo/auth";

describe("Two-Tier Authorization - Platform Guard", () => {
  const superAdminSession = {
    user: {
      id: "admin-1",
      name: "Platform Admin",
      email: "admin@distribo.app",
      platformRole: "SUPER_ADMIN",
      distributorId: null,
      distributorRole: null,
    },
  };

  const ownerSession = {
    user: {
      id: "user-owner-1",
      name: "Distributor Mahajan",
      email: "owner@bismillah.com",
      platformRole: null,
      distributorId: "distributor-123",
      distributorRole: "OWNER",
    },
  };

  const managerSession = {
    user: {
      id: "user-mgr-1",
      name: "Godown Operator",
      email: "manager@bismillah.com",
      platformRole: null,
      distributorId: "distributor-123",
      distributorRole: "MANAGER",
    },
  };

  it("identifies SUPER_ADMIN correctly", () => {
    expect(isSuperAdmin(superAdminSession.user)).toBe(true);
    expect(isSuperAdmin(ownerSession.user)).toBe(false);
    expect(isSuperAdmin(managerSession.user)).toBe(false);
  });

  it("permits SUPER_ADMIN to pass platform gate", () => {
    const user = requireSuperAdmin(superAdminSession);
    expect(user.id).toBe("admin-1");
  });

  it("strictly blocks distributor OWNER from accessing platform control center", () => {
    expect(() => requireSuperAdmin(ownerSession)).toThrow(AuthorizationError);
    expect(() => requireSuperAdmin(ownerSession)).toThrow(
      "Access denied: Requires Platform SUPER_ADMIN privileges"
    );
  });

  it("strictly blocks distributor MANAGER from accessing platform control center", () => {
    expect(() => requireSuperAdmin(managerSession)).toThrow(AuthorizationError);
  });

  it("rejects unauthenticated requests to platform gate", () => {
    expect(() => requireSuperAdmin(null)).toThrow("Authentication required");
  });
});

describe("Two-Tier Authorization - Distributor Tenant RBAC", () => {
  const ownerSession = {
    user: {
      id: "user-owner-1",
      name: "Distributor Mahajan",
      email: "owner@bismillah.com",
      platformRole: null,
      distributorId: "distributor-123",
      distributorRole: "OWNER",
    },
  };

  const managerSession = {
    user: {
      id: "user-mgr-1",
      name: "Godown Operator",
      email: "manager@bismillah.com",
      platformRole: null,
      distributorId: "distributor-123",
      distributorRole: "MANAGER",
    },
  };

  const srSession = {
    user: {
      id: "user-sr-1",
      name: "Field Sales Rep",
      email: "sr@bismillah.com",
      platformRole: null,
      distributorId: "distributor-123",
      distributorRole: "SR",
    },
  };

  const superAdminWithoutTenant = {
    user: {
      id: "admin-1",
      name: "Platform Admin",
      email: "admin@distribo.app",
      platformRole: "SUPER_ADMIN",
      distributorId: null,
      distributorRole: null,
    },
  };

  it("allows OWNER, MANAGER, and SR within their tenant", () => {
    const ownerRes = requireTenantAccess(ownerSession);
    expect(ownerRes.distributorId).toBe("distributor-123");
    expect(ownerRes.role).toBe("OWNER");

    const mgrRes = requireTenantAccess(managerSession);
    expect(mgrRes.role).toBe("MANAGER");

    const srRes = requireTenantAccess(srSession);
    expect(srRes.role).toBe("SR");
  });

  it("restricts OWNER-only actions from MANAGER and SR", () => {
    expect(() => requireTenantOwner(ownerSession)).not.toThrow();
    expect(() => requireTenantOwner(managerSession)).toThrow(
      "Requires one of [OWNER] roles"
    );
    expect(() => requireTenantOwner(srSession)).toThrow(
      "Requires one of [OWNER] roles"
    );
  });

  it("blocks users without a distributorId from tenant operations", () => {
    expect(() => requireTenantAccess(superAdminWithoutTenant)).toThrow(
      "User is not associated with any distributor tenant"
    );
  });
});

describe("Tenant Lifecycle & Suspension Enforcement", () => {
  it("permits ACTIVE distributors to proceed", () => {
    expect(() => validateDistributorStatus("ACTIVE")).not.toThrow();
  });

  it("throws clear suspension message for SUSPENDED distributors", () => {
    expect(() => validateDistributorStatus("SUSPENDED")).toThrow(
      "Your distributor account has been suspended"
    );
  });

  it("throws clear deactivation message for DEACTIVATED distributors", () => {
    expect(() => validateDistributorStatus("DEACTIVATED")).toThrow(
      "This distributor account has been deactivated"
    );
  });
});
