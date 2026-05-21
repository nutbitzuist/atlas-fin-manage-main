import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface SavingsGoal {
  id: string;
  name: string;
  current_amount: number;
  target_amount: number;
  currency: string;
  target_date?: string;
}

interface SavingsGoalsWidgetProps {
  goals: SavingsGoal[];
  currency?: string;
}

export const SavingsGoalsWidget = ({
  goals,
  currency = "THB"
}: SavingsGoalsWidgetProps) => {
  const { t } = useTranslation('dashboard');
  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    return target > 0 ? (current / target) * 100 : 0;
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('widgets.savingsGoals')}</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('widgets.noActiveGoals')}</p>
        ) : (
          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => {
              const progress = calculateProgress(goal.current_amount, goal.target_amount);
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{goal.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(goal.current_amount, goal.currency)} {t('widgets.of')}{' '}
                        {formatCurrency(goal.target_amount, goal.currency)}
                      </p>
                    </div>
                    <span className="text-sm font-medium flex-shrink-0 min-w-[3rem] text-right">
                      {Math.min(progress, 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                  {goal.target_date && (
                    <p className="text-xs text-muted-foreground">
                      {t('widgets.target')}: {new Date(goal.target_date).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
