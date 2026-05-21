import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FreshnessItem {
  label: string;
  lastUpdated: string | null; // ISO date string
  link: string;
}

interface DataFreshnessBannerProps {
  items: FreshnessItem[];
  monthlyUpdateDone: boolean;
  currentMonth: string; // e.g. "March 2026"
}

const getDaysSince = (dateStr: string | null): number => {
  if (!dateStr) return 999;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const getFreshnessStatus = (days: number): { color: string; bgColor: string; label: string; icon: string } => {
  if (days <= 7) return { color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", label: "Fresh", icon: "🟢" };
  if (days <= 30) return { color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Needs review", icon: "🟡" };
  return { color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Stale", icon: "🔴" };
};

const formatLastUpdated = (dateStr: string | null): string => {
  if (!dateStr) return "Never updated";
  const days = getDaysSince(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

export const DataFreshnessBanner = ({ items, monthlyUpdateDone, currentMonth }: DataFreshnessBannerProps) => {
  const navigate = useNavigate();

  const staleItems = items.filter(item => getDaysSince(item.lastUpdated) > 30);
  const needsReviewItems = items.filter(item => {
    const days = getDaysSince(item.lastUpdated);
    return days > 7 && days <= 30;
  });
  const allFresh = staleItems.length === 0 && needsReviewItems.length === 0;

  return (
    <div className="space-y-3 mb-6">
      {/* Monthly Update CTA */}
      {!monthlyUpdateDone && (
        <Card className="border-2 border-primary/30 bg-primary/5 shadow-md">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Monthly Financial Update — {currentMonth}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Complete your monthly review to keep your financial data accurate
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate("/monthly-update")} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Start Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Freshness Indicators */}
      {!allFresh && (
        <Card className="border border-border/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Data Freshness</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => {
                const days = getDaysSince(item.lastUpdated);
                const status = getFreshnessStatus(days);
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.link)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 hover:shadow-sm ${status.bgColor} ${status.color} cursor-pointer`}
                  >
                    <span>{status.icon}</span>
                    <span>{item.label}</span>
                    <span className="opacity-70">· {formatLastUpdated(item.lastUpdated)}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All fresh indicator */}
      {allFresh && monthlyUpdateDone && (
        <Card className="border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                All data is up to date — {currentMonth} review complete ✓
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
