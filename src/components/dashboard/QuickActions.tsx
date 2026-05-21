import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown, TrendingUp, Wallet, Upload, Calendar, Target } from "lucide-react";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { AddAccountDialog } from "./AddAccountDialog";
import { AddBillDialog } from "./AddBillDialog";
import { AddSavingsGoalDialog } from "./AddSavingsGoalDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapCsvRowsToTransactions, parseTransactionCsv } from "@/services/transaction-import";
import { insertTransactions } from "@/services/transaction-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

interface QuickActionsProps {
  onRefresh?: () => void;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Check that your CSV has date, amount, type, and category columns.";

export const QuickActions = ({ onRefresh }: QuickActionsProps) => {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [savingsGoalDialogOpen, setSavingsGoalDialogOpen] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);

  const handleSuccess = () => {
    onRefresh?.();
  };

  const handleCsvUpload = () => {
    csvInputRef.current?.click();
  };

  const handleCsvSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setCsvImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const transactions = mapCsvRowsToTransactions(user.id, parseTransactionCsv(await file.text()));

      await insertTransactions(user.id, transactions, {
        source: "csv_import",
        file_name: file.name,
      });

      toast({
        title: "CSV imported",
        description: `${transactions.length} transaction${transactions.length === 1 ? "" : "s"} added.`,
      });
      onRefresh?.();
    } catch (error: unknown) {
      toast({
        title: "CSV import failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <>
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvSelected}
      />

      {/* Mobile: Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setExpenseDialogOpen(true)}>
              <TrendingDown className="mr-2 h-4 w-4 text-destructive" />
              <span>{t('quickActions.addExpense')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIncomeDialogOpen(true)}>
              <TrendingUp className="mr-2 h-4 w-4 text-success" />
              <span>{t('quickActions.addIncome')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAccountDialogOpen(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              <span>{t('quickActions.addAccount')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBillDialogOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>{t('quickActions.addBill')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSavingsGoalDialogOpen(true)}>
              <Target className="mr-2 h-4 w-4" />
              <span>{t('quickActions.addSavingsGoal')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCsvUpload} disabled={csvImporting}>
              <Upload className="mr-2 h-4 w-4" />
              <span>{t('quickActions.uploadCsv')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Horizontal Button Group */}
      <div className="hidden md:flex gap-3 mb-6 flex-wrap">
        <Button
          size="lg"
          variant="default"
          onClick={() => setExpenseDialogOpen(true)}
          className="flex-1 min-w-[180px]"
        >
          <TrendingDown className="mr-2 h-5 w-5" />
          {t('quickActions.addExpense')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setIncomeDialogOpen(true)}
          className="flex-1 min-w-[180px]"
        >
          <TrendingUp className="mr-2 h-5 w-5" />
          {t('quickActions.addIncome')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setAccountDialogOpen(true)}
          className="flex-1 min-w-[180px]"
        >
          <Wallet className="mr-2 h-5 w-5" />
          {t('quickActions.addAccount')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setBillDialogOpen(true)}
          className="flex-1 min-w-[180px]"
        >
          <Calendar className="mr-2 h-5 w-5" />
          {t('quickActions.addBill')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => setSavingsGoalDialogOpen(true)}
          className="flex-1 min-w-[180px]"
        >
          <Target className="mr-2 h-5 w-5" />
          {t('quickActions.addGoal')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleCsvUpload}
          disabled={csvImporting}
          className="flex-1 min-w-[180px]"
        >
          <Upload className="mr-2 h-5 w-5" />
          {csvImporting ? "Importing..." : t('quickActions.uploadCsv')}
        </Button>
      </div>

      {/* Dialogs */}
      <AddTransactionDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        type="expense"
        onSuccess={handleSuccess}
      />
      <AddTransactionDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        type="income"
        onSuccess={handleSuccess}
      />
      <AddAccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        onSuccess={handleSuccess}
      />
      <AddBillDialog
        open={billDialogOpen}
        onOpenChange={setBillDialogOpen}
        onSuccess={handleSuccess}
      />
      <AddSavingsGoalDialog
        open={savingsGoalDialogOpen}
        onOpenChange={setSavingsGoalDialogOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
};
