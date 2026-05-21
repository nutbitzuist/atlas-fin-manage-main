import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor?: string;
  trendValue?: number;
  trendLabel?: string;
}

export const StatCard = ({ title, value, icon: Icon, iconColor = "text-primary", trendValue, trendLabel }: StatCardProps) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          ฿{value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        {trendValue !== undefined && (
          <div className="flex items-center mt-2 text-xs">
            {trendValue > 0 ? (
              <span className="text-success flex items-center font-medium">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{trendValue}%
              </span>
            ) : trendValue < 0 ? (
              <span className="text-destructive flex items-center font-medium">
                <TrendingDown className="h-3 w-3 mr-1" />
                {trendValue}%
              </span>
            ) : (
              <span className="text-muted-foreground font-medium">0%</span>
            )}
            {trendLabel && <span className="text-muted-foreground ml-1.5">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
