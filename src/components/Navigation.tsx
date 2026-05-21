import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PieChart,
  DollarSign,
  Calendar,
  Target,
  Shield,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  Building2,
  Car,
  Package,
  Briefcase,
  BarChart3,
  RefreshCw,
  Brain,
  CalendarCheck,
  Flame,
  UserPlus,
  Trophy,
  Crown,
  Mail,
  Lock,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  translationKey: string;
  path?: string;
  icon: LucideIcon;
  gate?: "Plus" | "Pro";
  subItems?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    translationKey: "navigation.dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    translationKey: "navigation.dailyBrief",
    path: "/daily-brief",
    icon: CalendarCheck,
  },
  {
    translationKey: "navigation.weeklyReview",
    path: "/weekly-review",
    icon: BarChart3,
  },
  {
    translationKey: "navigation.streaks",
    path: "/streaks",
    icon: Flame,
  },
  {
    translationKey: "navigation.monthlyUpdate",
    path: "/monthly-update",
    icon: RefreshCw,
  },
  {
    translationKey: "navigation.assets",
    path: "/assets",
    icon: Wallet,
    subItems: [
      { translationKey: "navigation.cashAccounts", path: "/assets/cash", icon: DollarSign },
      { translationKey: "navigation.investments", path: "/assets/investments", icon: TrendingUp },
      { translationKey: "navigation.realEstate", path: "/assets/real-estate", icon: Home },
      { translationKey: "navigation.vehicles", path: "/assets/vehicles", icon: Car },
      { translationKey: "navigation.otherAssets", path: "/assets/other", icon: Package },
    ],
  },
  {
    translationKey: "navigation.liabilities",
    path: "/liabilities",
    icon: CreditCard,
    subItems: [
      { translationKey: "navigation.creditCards", path: "/liabilities/credit-cards", icon: CreditCard },
      { translationKey: "navigation.loans", path: "/liabilities/loans", icon: Building2 },
    ],
  },
  {
    translationKey: "navigation.income",
    path: "/income",
    icon: TrendingUp,
  },
  {
    translationKey: "navigation.expenses",
    path: "/expenses",
    icon: TrendingDown,
  },
  {
    translationKey: "navigation.budget",
    path: "/budget",
    icon: PieChart,
  },
  {
    translationKey: "navigation.cashFlow",
    path: "/cash-flow",
    icon: BarChart3,
  },
  {
    translationKey: "navigation.billsSubscriptions",
    path: "/bills",
    icon: Calendar,
  },
  {
    translationKey: "navigation.netWorth",
    path: "/net-worth",
    icon: TrendingUp,
  },
  {
    translationKey: "navigation.financialHealth",
    path: "/financial-health",
    icon: Shield,
  },
  {
    translationKey: "navigation.financialInsights",
    path: "/financial-insights",
    icon: Brain,
  },
  {
    translationKey: "navigation.growth",
    icon: BarChart3,
    subItems: [
      { translationKey: "navigation.referrals", path: "/referrals", icon: UserPlus },
      { translationKey: "navigation.challenges", path: "/challenges", icon: Trophy },
      { translationKey: "navigation.household", path: "/household", icon: Home, gate: "Plus" },
      { translationKey: "navigation.trust", path: "/trust", icon: Shield },
      { translationKey: "navigation.premium", path: "/premium", icon: Crown },
      { translationKey: "navigation.aiCoach", path: "/ai-coach", icon: Brain, gate: "Pro" },
      { translationKey: "navigation.lifecycleEmails", path: "/lifecycle-emails", icon: Mail },
      { translationKey: "navigation.growthDashboard", path: "/growth-dashboard", icon: BarChart3, gate: "Pro" },
    ],
  },
  {
    translationKey: "navigation.emergencyFund",
    path: "/settings/emergency-fund",
    icon: Shield,
  },
  {
    translationKey: "navigation.savingsGoals",
    path: "/savings-goals",
    icon: Target,
  },
  {
    translationKey: "navigation.insurance",
    path: "/insurance",
    icon: Shield,
  },
  {
    translationKey: "navigation.taxPlanning",
    path: "/tax-planning",
    icon: FileText,
  },
  {
    translationKey: "navigation.reportsAnalytics",
    path: "/reports-analytics",
    icon: Briefcase,
  },
  {
    translationKey: "navigation.reports",
    path: "/reports",
    icon: FileText,
  },
  {
    translationKey: "navigation.settings",
    path: "/settings",
    icon: Settings,
  },
];

const NavItemComponent = ({ item }: { item: NavItem }) => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  if (item.subItems) {
    const hasActiveSubItem = item.subItems.some((subItem) =>
      location.pathname === subItem.path
    );
    const isActive = location.pathname === item.path;

    return (
      <div>
        <div className="flex items-center">
          {item.path ? (
            <Link
              to={item.path}
              className={cn(
                "flex-1 flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-l-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : hasActiveSubItem
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{t(item.translationKey)}</span>
            </Link>
          ) : (
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 text-sm font-medium">
              <Icon className="h-5 w-5" />
              <span>{t(item.translationKey)}</span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "px-3 py-2.5 text-sm font-medium rounded-r-lg transition-colors",
              isActive || hasActiveSubItem
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {item.subItems.map((subItem) => {
              const SubIcon = subItem.icon;
              const isActive = location.pathname === subItem.path;

              return (
                <Link
                  key={subItem.path}
                  to={subItem.path!}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  >
                  <SubIcon className="h-4 w-4" />
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{t(subItem.translationKey)}</span>
                    {subItem.gate && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {subItem.gate}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path!}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate">{t(item.translationKey)}</span>
        {item.gate && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Lock className="h-3 w-3" />
            {item.gate}
          </span>
        )}
      </span>
    </Link>
  );
};

export const Navigation = () => {
  return (
    <nav className="w-64 border-r bg-card h-full flex flex-col">
      <div className="p-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">FD</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">FinDash OS</h1>
        </Link>
      </div>

      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <NavItemComponent key={item.translationKey} item={item} />
          ))}
        </div>
      </div>
    </nav>
  );
};
