"use client";

import { signOut } from "@distribo/auth/client";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
      title="লগআউট (Log Out)"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
