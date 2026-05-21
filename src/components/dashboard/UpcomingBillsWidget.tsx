import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface Bill {
  id: string;
  name: string;
  amount: number;
  currency: string;
  due_date: string;
  is_paid: boolean;
  category?: string;
}

interface UpcomingBillsWidgetProps {
  bills: Bill[];
  currency?: string;
}

export const UpcomingBillsWidget = ({
  bills,
  currency = "THB"
}: UpcomingBillsWidgetProps) => {
  const { t } = useTranslation('dashboard');
  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('widgets.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('widgets.tomorrow');
    } else {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    }
  };

  const getDaysUntilDue = (dateString: string) => {
    const due = new Date(dateString);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = (dateString: string) => {
    return getDaysUntilDue(dateString) < 0;
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('widgets.upcomingBills')}</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('widgets.noUpcomingBills')}</p>
        ) : (
          <div className="space-y-3">
            {bills.slice(0, 5).map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between space-x-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{bill.name}</p>
                    {isOverdue(bill.due_date) && !bill.is_paid && (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(bill.due_date)}
                    </p>
                    {bill.is_paid && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {t('widgets.paid')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-medium ${isOverdue(bill.due_date) && !bill.is_paid ? 'text-destructive' : ''}`}>
                    {formatCurrency(bill.amount, bill.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
