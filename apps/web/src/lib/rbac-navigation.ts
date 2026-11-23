export type UserRole = "OWNER" | "MANAGER" | "SR" | "SUPER_ADMIN";

export interface NavItem {
  id: string;
  href: string;
  iconName: string;
  labelKey: string;
  subtitleKey: string;
  allowedRoles: UserRole[];
  badge?: string;
}

export interface QuickActionItem {
  id: string;
  href: string;
  iconName: string;
  titleKey: string;
  descKey: string;
  colorClass: string;
  allowedRoles: UserRole[];
}

export const ALL_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    iconName: "LayoutDashboard",
    labelKey: "navDashboard",
    subtitleKey: "subDashboard",
    allowedRoles: ["OWNER", "MANAGER", "SR"],
  },
  {
    id: "pos",
    href: "/pos",
    iconName: "ShoppingCart",
    labelKey: "navPOS",
    subtitleKey: "subPOS",
    allowedRoles: ["OWNER", "MANAGER", "SR"],
  },
  {
    id: "products",
    href: "/products",
    iconName: "Package",
    labelKey: "navProducts",
    subtitleKey: "subProducts",
    allowedRoles: ["OWNER", "MANAGER", "SR"],
  },
  {
    id: "inventory",
    href: "/inventory",
    iconName: "Truck",
    labelKey: "navInventory",
    subtitleKey: "subInventory",
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    id: "retailers",
    href: "/retailers",
    iconName: "Store",
    labelKey: "navRetailers",
    subtitleKey: "subRetailers",
    allowedRoles: ["OWNER", "MANAGER", "SR"],
  },
  {
    id: "khata",
    href: "/khata",
    iconName: "BookOpen",
    labelKey: "navKhata",
    subtitleKey: "subKhata",
    allowedRoles: ["OWNER", "MANAGER", "SR"],
  },
  {
    id: "closing",
    href: "/closing",
    iconName: "Clock",
    labelKey: "navClosing",
    subtitleKey: "subClosing",
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    id: "settings",
    href: "/settings",
    iconName: "Settings",
    labelKey: "navSettings",
    subtitleKey: "subSettings",
    allowedRoles: ["OWNER"],
  },
];

export const ALL_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "qa-pos",
    href: "/pos",
    iconName: "Receipt",
    titleKey: "qaNewInvoice",
    descKey: "qaNewInvoiceDesc",
    colorClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
    allowedRoles: ["OWNER", "MANAGER", "SR"],
  },
  {
    id: "qa-due",
    href: "/khata",
    iconName: "Wallet",
    titleKey: "qaCollectDue",
    descKey: "qaCollectDueDesc",
    colorClass: "bg-blue-50 text-blue-600 border-blue-200",
    allowedRoles: ["OWNER", "MANAGER", "SR"],
  },
  {
    id: "qa-stock",
    href: "/inventory",
    iconName: "PackagePlus",
    titleKey: "qaStockIn",
    descKey: "qaStockInDesc",
    colorClass: "bg-purple-50 text-purple-600 border-purple-200",
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    id: "qa-expense",
    href: "/closing",
    iconName: "Coffee",
    titleKey: "qaPettyExpense",
    descKey: "qaPettyExpenseDesc",
    colorClass: "bg-amber-50 text-amber-600 border-amber-200",
    allowedRoles: ["OWNER", "MANAGER"],
  },
  {
    id: "qa-retailer",
    href: "/retailers",
    iconName: "UserPlus",
    titleKey: "qaAddRetailer",
    descKey: "qaAddRetailerDesc",
    colorClass: "bg-indigo-50 text-indigo-600 border-indigo-200",
    allowedRoles: ["OWNER", "MANAGER", "SR"],
  },
];

export function getFilteredNavItems(role: UserRole | string | null | undefined): NavItem[] {
  if (!role) return [];
  return ALL_NAV_ITEMS.filter((item) => item.allowedRoles.includes(role as UserRole));
}

export function getFilteredQuickActions(role: UserRole | string | null | undefined): QuickActionItem[] {
  if (!role) return [];
  return ALL_QUICK_ACTIONS.filter((item) => item.allowedRoles.includes(role as UserRole));
}
