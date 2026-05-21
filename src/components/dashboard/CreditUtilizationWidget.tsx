import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CreditUtilizationWidgetProps {
  currentBalance: number;
  creditLimit: number;
  currency?: string;
}

export const CreditUtilizationWidget = ({
  currentBalance,
  creditLimit,
  currency = "THB"
}: CreditUtilizationWidgetProps) => {
  const { t } = useTranslation('dashboard');
  const utilization = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;

  const getUtilizationColor = () => {
    if (utilization < 30) return 'text-success';
    if (utilization < 70) return 'text-warning';
    return 'text-destructive';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('widgets.creditUtilization')}</CardTitle>
        <CreditCard className={`h-4 w-4 ${getUtilizationColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline gap-3">
            <span className="text-2xl font-bold">{utilization.toFixed(1)}%</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {utilization < 30 ? t('widgets.excellent') : utilization < 70 ? t('widgets.good') : t('widgets.high')}
            </span>
          </div>
          <Progress
            value={Math.min(utilization, 100)}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(currentBalance)} {t('widgets.used')}</span>
            <span>{formatCurrency(creditLimit)} {t('widgets.limit')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
