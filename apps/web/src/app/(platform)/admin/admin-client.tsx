"use client";

import { useState } from "react";
import { updateDistributorStatusAction } from "@/lib/actions/admin-actions";

export default function AdminClientActions({
  distributorId,
  currentStatus,
}: {
  distributorId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateDistributorStatusAction(distributorId, nextStatus as any);
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleStatus}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        currentStatus === "ACTIVE"
          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
      } disabled:opacity-50`}
    >
      {loading ? "..." : currentStatus === "ACTIVE" ? "Suspend Depot" : "Re-activate"}
    </button>
  );
}
