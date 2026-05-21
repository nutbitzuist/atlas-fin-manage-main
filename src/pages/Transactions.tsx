import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCategorizationSuggestions } from "@/utils/planning";
import { Plus, Sparkles } from "lucide-react";
import { RecentTransactionsTable, Transaction } from "@/components/dashboard/RecentTransactionsTable";
import SEO from "@/components/SEO";
import { getErrorMessage } from "@/utils/errors";
import { getTransactionsByUserId, updateTransactionCategory } from "@/services/transaction-service";
import { getProfileDisplayName } from "@/services/profile-service";

const Transactions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/login");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      } else {
        fetchUserProfile(session.user.id);
        fetchTransactions(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const displayName = await getProfileDisplayName(userId, "User");
    setUserName(displayName);
  };

  const fetchTransactions = async (userId: string) => {
    try {
      const data = await getTransactionsByUserId(userId, {
        orderBy: "transaction_date",
        ascending: false,
      });

      setTransactions((data || []) as Transaction[]);

      // Calculate monthly totals
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyData = (data || []).filter(t => new Date(t.transaction_date) >= firstDayOfMonth);

      const income = monthlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = monthlyData.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const netCashFlow = monthlyIncome - monthlyExpenses;
  const categorySuggestions = getCategorizationSuggestions(transactions).slice(0, 6);

  const applyCategorySuggestion = async (transactionId: string, suggestedCategory: string) => {
    if (!session?.user.id) return;

    try {
      await updateTransactionCategory(transactionId, session.user.id, suggestedCategory);

      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, category: suggestedCategory } : transaction
        )
      );

      toast({
        title: "Category updated",
        description: `Transaction moved to ${suggestedCategory}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Unable to update category",
        description: getErrorMessage(error, "Failed to update category"),
        variant: "destructive",
      });
    }
  };

  return (
    <Layout userName={userName}>
      <SEO
        title="Transactions"
        description="View and manage all your financial transactions in one place. Filter by category, date, and amount. Export transaction history for tax preparation and financial analysis."
        keywords="transaction history, financial transactions, transaction management, transaction log, expense transactions, income transactions"
        canonical="/transactions"
      />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Transactions</h2>
            <p className="text-muted-foreground">View and manage all your transactions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/income")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
            <Button variant="outline" onClick={() => navigate("/expenses")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {categorySuggestions.length > 0 && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Smart Category Suggestions
              </CardTitle>
              <CardDescription>
                Suggested cleanup based on transaction descriptions and merchants.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {categorySuggestions.map(({ transaction, suggestedCategory }) => (
                <div key={transaction.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{transaction.merchant || transaction.description || "Transaction"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Current: {transaction.category}</span>
                      <Badge variant="outline">Suggested: {suggestedCategory}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => applyCategorySuggestion(transaction.id, suggestedCategory!)}
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                +฿{monthlyIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                -฿{monthlyExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Cash Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netCashFlow >= 0 ? '+' : ''}฿{netCashFlow.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <RecentTransactionsTable
          transactions={transactions}
          onRowClick={(transaction) => {
            // Transaction row clicked - could navigate to detail view in future
          }}
        />
      </div>
    </Layout>
  );
};

export default Transactions;
