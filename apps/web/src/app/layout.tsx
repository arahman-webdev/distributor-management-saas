import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Distribo | FMCG & Grocery Distributor Management SaaS",
  description: "Next-generation billing, inventory, and Baki management for Bangladeshi FMCG distributors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
