import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmergencyFundWidgetProps {
  currentAmount: number;
  targetAmount: number;
  currency?: string;
}

export const EmergencyFundWidget = ({
  currentAmount,
  targetAmount,
  currency = "THB"
}: EmergencyFundWidgetProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const isComplete = progress >= 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card 
      className="shadow-md cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
      onClick={() => navigate("/settings/emergency-fund")}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">{t('widgets.emergencyFund')}</CardTitle>
        <Shield className={`h-4 w-4 transition-transform group-hover:scale-110 ${isComplete ? 'text-success' : 'text-warning'}`} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('widgets.progress')}</span>
            <span className="font-medium">{Math.min(progress, 100).toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(currentAmount)}</span>
            <span>{formatCurrency(targetAmount)}</span>
          </div>
          {isComplete && (
            <p className="text-xs text-success font-medium">{t('widgets.goalAchieved')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
