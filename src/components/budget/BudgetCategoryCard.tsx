import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { BudgetCategory } from "@/hooks/useBudgetData";
import { useEffect, useState } from "react";

type BudgetCategoryCardProps = {
  category: BudgetCategory;
  onBudgetUpdate: (categoryId: string, amount: number) => Promise<void> | void;
  onDelete: (categoryId: string) => Promise<void> | void;
};

export const BudgetCategoryCard = ({
  category,
  onBudgetUpdate,
  onDelete,
}: BudgetCategoryCardProps) => {
  const percentage = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
  const remaining = category.budgeted - category.spent;
  const progressColor =
    percentage > 100
      ? "bg-destructive"
      : percentage >= 80
        ? "bg-warning"
        : "bg-success";
  const [inputValue, setInputValue] = useState(category.budgeted.toString());

  useEffect(() => {
    setInputValue(category.budgeted.toString());
  }, [category.budgeted]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{category.name}</h4>
                <p className="text-xs text-muted-foreground">
                  ฿{category.spent.toLocaleString()} / ฿{category.budgeted.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Monthly Budget</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={(e) => {
                      const newAmount = parseFloat(e.target.value) || 0;
                      if (newAmount !== category.budgeted) {
                        void onBudgetUpdate(category.id, newAmount);
                      }
                    }}
                    className="w-32 text-right"
                  />
                </div>
              </div>
              <div className="text-right min-w-[120px]">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`font-semibold ${remaining >= 0 ? "text-success" : "text-destructive"}`}>
                  ฿{remaining.toLocaleString()}
                </p>
              </div>
              <Badge
                variant={percentage > 100 ? "destructive" : percentage >= 80 ? "secondary" : "default"}
              >
                {percentage.toFixed(0)}%
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  void onDelete(category.id);
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <ProgressBar value={Math.min(percentage, 100)} className={`h-2 ${progressColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProgressBarProps {
  value: number;
  className?: string;
}

const ProgressBar = ({ value, className }: ProgressBarProps) => {
  const heightClass = "h-2 rounded-full bg-secondary overflow-hidden";

  return (
    <div className={heightClass}>
      <div
        className={`h-full ${className ?? ""}`}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
};
