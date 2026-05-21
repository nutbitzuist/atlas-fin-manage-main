import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NetWorthCardProps {
  netWorth: number;
  change: number;
  changePercentage: number;
}

export const NetWorthCard = ({ netWorth, change, changePercentage }: NetWorthCardProps) => {
  const { t } = useTranslation('dashboard');
  const isPositive = change >= 0;

  return (
    <Card className="col-span-full md:col-span-2 shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('widgets.netWorth')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-4xl font-bold text-foreground">
          ฿{netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`flex items-center gap-2 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span className="font-medium">
            {isPositive ? '+' : ''}฿{change.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-muted-foreground">
            ({isPositive ? '+' : ''}{changePercentage.toFixed(2)}%)
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
