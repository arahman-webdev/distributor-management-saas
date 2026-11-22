/**
 * Two-Tier Authorization Guards & Verification Utilities
 * Strictly separates Platform SUPER_ADMIN authority from Distributor Tenant RBAC.
 */

export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AuthorizationError";
  }
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  platformRole?: string | null;
  distributorRole?: string | null;
  distributorId?: string | null;
}

export interface AuthSession {
  user: SessionUser;
}

/**
 * Checks whether the user possesses platform-wide SUPER_ADMIN privileges.
 */
export function isSuperAdmin(user?: SessionUser | null): boolean {
  return user?.platformRole === "SUPER_ADMIN";
}

/**
 * Enforces that the active session user is a verified SUPER_ADMIN.
 * Rejects all tenant-level users, including distributor OWNERs.
 */
export function requireSuperAdmin(session?: AuthSession | null): SessionUser {
  if (!session?.user) {
    throw new AuthorizationError("Authentication required", 401);
  }
  if (!isSuperAdmin(session.user)) {
    throw new AuthorizationError(
      "Access denied: Requires Platform SUPER_ADMIN privileges",
      403
    );
  }
  return session.user;
}

/**
 * Enforces that the session user belongs to a specific distributor tenant
 * and has one of the allowed distributor roles (OWNER, MANAGER, SR).
 */
export function requireTenantAccess(
  session: AuthSession | null | undefined,
  allowedRoles: Array<"OWNER" | "MANAGER" | "SR"> = ["OWNER", "MANAGER", "SR"]
): { user: SessionUser; distributorId: string; role: string } {
  if (!session?.user) {
    throw new AuthorizationError("Authentication required", 401);
  }

  const { distributorId, distributorRole } = session.user;

  if (!distributorId) {
    throw new AuthorizationError(
      "User is not associated with any distributor tenant",
      403
    );
  }

  if (!distributorRole || !allowedRoles.includes(distributorRole as any)) {
    throw new AuthorizationError(
      `Access denied: Requires one of [${allowedRoles.join(", ")}] roles in this distributor`,
      403
    );
  }

  return {
    user: session.user,
    distributorId,
    role: distributorRole,
  };
}

/**
 * Enforces that the session user is specifically an OWNER of their distributor.
 */
export function requireTenantOwner(session?: AuthSession | null) {
  return requireTenantAccess(session, ["OWNER"]);
}

/**
 * Verifies that the distributor tenant is currently in ACTIVE status.
 * Blocks all operations for SUSPENDED or DEACTIVATED accounts.
 */
export function validateDistributorStatus(status: string): void {
  if (status === "SUSPENDED") {
    throw new AuthorizationError(
      "Your distributor account has been suspended by the platform administrator. Please contact support.",
      403
    );
  }
  if (status === "DEACTIVATED") {
    throw new AuthorizationError(
      "This distributor account has been deactivated.",
      403
    );
  }
  if (status !== "ACTIVE") {
    throw new AuthorizationError("Invalid distributor status", 403);
  }
}
