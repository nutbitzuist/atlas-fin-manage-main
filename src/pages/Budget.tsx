import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { getProfileDisplayName } from "@/services/profile-service";
import { BudgetCategoryCard } from "@/components/budget/BudgetCategoryCard";
import { useBudgetData } from "@/hooks/useBudgetData";
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Copy,
  RotateCcw,
  Home,
  UtensilsCrossed,
  Car,
  Gamepad2,
  Zap,
  ShoppingCart,
  GraduationCap,
  Heart,
  Briefcase,
  Smartphone,
  Save,
  Sparkles
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Category icon mapping
const CATEGORY_ICONS: { [key: string]: React.ComponentType<{ className?: string }> } = {
  "Housing": Home,
  "Food & Dining": UtensilsCrossed,
  "Transportation": Car,
  "Entertainment": Gamepad2,
  "Utilities": Zap,
  "Shopping": ShoppingCart,
  "Education": GraduationCap,
  "Healthcare": Heart,
  "Personal": Smartphone,
  "Business": Briefcase,
};

const Budget = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const {
    loading: budgetsLoading,
    budgetCategories,
    userCategories,
    smartSuggestions,
    smartBudgetLoading,
    lastMonthSpent,
    fetchBudgetsAndTransactions,
    updateBudgetAmount: updateBudgetAmountWithHook,
    createBudget: createBudgetWithHook,
    deleteBudget: deleteBudgetWithHook,
    copyFromLastMonth: copyFromLastMonthWithHook,
    resetBudget: resetBudgetWithHook,
    generateSmartBudget: generateSmartBudgetWithHook,
    applySmartBudget: applySmartBudgetWithHook,
    initializeFromCategories: initializeFromCategoriesWithHook,
  } = useBudgetData(currentMonth, toast);

  // Form state for new budget
  const [newBudgetForm, setNewBudgetForm] = useState({
    category: "",
    monthlyLimit: "",
    description: "",
  });

  const fetchUserProfile = useCallback(async (userId: string) => {
    const displayName = await getProfileDisplayName(userId, "User");
    setUserName(displayName);
  }, []);

  const loadBudgetData = useCallback(async (userId: string) => {
    await Promise.all([fetchUserProfile(userId), fetchBudgetsAndTransactions(userId)]);
  }, [fetchBudgetsAndTransactions, fetchUserProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setLoading(false);
        navigate("/login");
      } else {
        void loadBudgetData(nextSession.user.id).finally(() => {
          setLoading(false);
        });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
        setLoading(false);
        return;
      }

      void loadBudgetData(session.user.id).finally(() => {
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, fetchBudgetsAndTransactions, loadBudgetData, navigate]);

  // CRUD operations for budgets
  const handleCreateBudget = () => {
    if (!session?.user?.id || !newBudgetForm.category || !newBudgetForm.monthlyLimit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    void createBudgetWithHook(session.user.id, {
      category: newBudgetForm.category,
      monthlyLimit: parseFloat(newBudgetForm.monthlyLimit),
      description: newBudgetForm.description,
    }).then(() => {
      setNewBudgetForm({
        category: "",
        monthlyLimit: "",
        description: "",
      });
      setIsAddDialogOpen(false);
    });
  };

  const handleUpdateBudgetAmount = (categoryId: string, newAmount: number) => {
    if (!session?.user?.id) return;
    void updateBudgetAmountWithHook(session.user.id, categoryId, newAmount);
  };

  const handleDeleteBudget = (categoryId: string) => {
    if (!session?.user?.id) return;
    void deleteBudgetWithHook(session.user.id, categoryId);
  };

  const handleCopyFromLastMonth = () => {
    if (!session?.user?.id) return;
    void copyFromLastMonthWithHook(session.user.id);
  };

  const handleResetBudget = () => {
    if (!session?.user?.id) return;
    void resetBudgetWithHook(session.user.id);
  };

  const handleGenerateSmartBudget = () => {
    if (!session?.user?.id) return;
    void generateSmartBudgetWithHook(session.user.id);
  };

  const handleApplySmartBudget = () => {
    if (!session?.user?.id || smartSuggestions.length === 0) return;
    void applySmartBudgetWithHook(session.user.id);
  };

  const handleInitializeFromCategories = () => {
    if (!session?.user?.id) return;
    void initializeFromCategoriesWithHook(session.user.id);
  };

  if (loading || budgetsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const remainingBudget = totalBudgeted - totalSpent;
  const budgetStatus = remainingBudget >= 0 ? "On Track" : "Over Budget";
  const spentPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const chartData = budgetCategories.map((cat) => ({
    category: cat.name,
    budgeted: cat.budgeted,
    actual: cat.spent,
  }));

  const alerts = budgetCategories
    .filter((cat) => {
      const percentage = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0;
      return percentage >= 80;
    })
    .map((cat) => {
      const percentage = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0;
      const remaining = cat.budgeted - cat.spent;
      return {
        category: cat.name,
        percentage,
        remaining,
        status: percentage > 100 ? "exceeded" : percentage >= 90 ? "critical" : "warning",
      };
    });

  return (
    <Layout userName={userName}>
      <SEO
        title="Budget Planning"
        description="Create and manage your monthly budget. Track spending by category, set budget limits, and monitor your financial discipline with real-time budget vs. actual comparisons."
        keywords="budget planner, monthly budget, budget tracking, spending categories, budget management, personal budget, budget vs actual"
        canonical="/budget"
      />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Budget</h2>
            <p className="text-muted-foreground">Plan and track your monthly budget</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="default" onClick={handleInitializeFromCategories}>
              <Plus className="h-4 w-4 mr-2" />
              Initialize from Categories
            </Button>
            <Button variant="outline" onClick={handleCopyFromLastMonth}>
              <Copy className="h-4 w-4 mr-2" />
              Copy from Last Month
            </Button>
            <Button variant="outline" onClick={handleResetBudget}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Budget Category</DialogTitle>
                  <DialogDescription>
                    Create a new budget category for tracking your expenses.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category Name</Label>
                    <Select
                      value={newBudgetForm.category}
                      onValueChange={(value) =>
                        setNewBudgetForm({ ...newBudgetForm, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {userCategories.length > 0 ? (
                          userCategories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              <span className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                              </span>
                            </SelectItem>
                          ))
                        ) : (
                          Object.keys(CATEGORY_ICONS).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monthly Budget (THB)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={newBudgetForm.monthlyLimit}
                      onChange={(e) =>
                        setNewBudgetForm({ ...newBudgetForm, monthlyLimit: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Add a description..."
                      value={newBudgetForm.description}
                      onChange={(e) =>
                        setNewBudgetForm({ ...newBudgetForm, description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBudget}>Create Budget</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Monthly Budget</p>
                  <p className="text-2xl font-bold">฿{totalBudgeted.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Spent This Month</p>
                  <p className="text-2xl font-bold">฿{totalSpent.toLocaleString()}</p>
                  {lastMonthSpent !== null && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium">
                      {totalSpent > lastMonthSpent ? (
                        <span className="text-destructive flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +฿{(totalSpent - lastMonthSpent).toLocaleString()} vs last month
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          -฿{(lastMonthSpent - totalSpent).toLocaleString()} vs last month
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Remaining Budget</p>
                  <p className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-success" : "text-destructive"}`}>
                    ฿{remainingBudget.toLocaleString()}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${remainingBudget >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                  <TrendingUp className={`h-6 w-6 ${remainingBudget >= 0 ? "text-success" : "text-destructive"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Budget Status</p>
                  <p className="text-2xl font-bold">{budgetStatus}</p>
                  <Badge variant={remainingBudget >= 0 ? "default" : "destructive"} className="mt-1">
                    {spentPercentage.toFixed(1)}% spent
                  </Badge>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${remainingBudget >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                  <AlertCircle className={`h-6 w-6 ${remainingBudget >= 0 ? "text-success" : "text-destructive"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Budget Alerts</h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert
                  key={alert.category}
                  variant={alert.status === "exceeded" ? "destructive" : "default"}
                  className={alert.status === "warning" ? "border-warning bg-warning/10" : ""}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-semibold">{alert.category}</span> is at{" "}
                    <span className="font-bold">{alert.percentage.toFixed(1)}%</span> of budget
                    {alert.status === "exceeded" ? (
                      <span className="ml-2 text-destructive">
                        (Over by ฿{Math.abs(alert.remaining).toLocaleString()})
                      </span>
                    ) : (
                      <span className="ml-2">
                        (฿{alert.remaining.toLocaleString()} remaining)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Smart Budget Builder */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Smart Budget Builder
                </CardTitle>
                <CardDescription>
                  Generate category limits from the last three months of spending, then apply the plan to this month.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={handleGenerateSmartBudget} disabled={smartBudgetLoading}>
                  {smartBudgetLoading ? "Generating..." : "Generate plan"}
                </Button>
                <Button onClick={handleApplySmartBudget} disabled={smartBudgetLoading || smartSuggestions.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Apply plan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {smartSuggestions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                Generate a smart budget to see recommended limits by category.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Suggested Total</p>
                    <p className="text-2xl font-bold">
                      ฿{smartSuggestions.reduce((sum, suggestion) => sum + suggestion.suggestedLimit, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Current Total</p>
                    <p className="text-2xl font-bold">
                      ฿{smartSuggestions.reduce((sum, suggestion) => sum + suggestion.currentLimit, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">{smartSuggestions.length}</p>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">3-mo avg</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Suggested</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {smartSuggestions.slice(0, 8).map((suggestion) => (
                        <TableRow key={suggestion.category}>
                          <TableCell className="font-medium">{suggestion.category}</TableCell>
                          <TableCell className="text-right">฿{Math.round(suggestion.averageSpent).toLocaleString()}</TableCell>
                          <TableCell className="text-right">฿{suggestion.currentLimit.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold">฿{suggestion.suggestedLimit.toLocaleString()}</TableCell>
                          <TableCell className={`text-right ${suggestion.change > 0 ? "text-warning" : suggestion.change < 0 ? "text-success" : ""}`}>
                            {suggestion.change > 0 ? "+" : ""}฿{suggestion.change.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Template Selection */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Budget Template</p>
                  <p className="text-xs text-muted-foreground">Apply a pre-configured budget template</p>
                </div>
                <Select defaultValue="custom">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="50-30-20">50/30/20 Rule</SelectItem>
                    <SelectItem value="zero-based">Zero-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Setup Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Budget Categories</h3>
          {budgetCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <p className="text-muted-foreground mb-4">No budget categories yet. Add your first category to get started!</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {budgetCategories.map((category) => (
                <BudgetCategoryCard
                  key={category.id}
                  category={category}
                  onBudgetUpdate={handleUpdateBudgetAmount}
                  onDelete={handleDeleteBudget}
                />
              ))}
            </div>
          )}
        </div>

        {/* Budget vs Actual Chart */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual</CardTitle>
              <CardDescription>Compare budgeted amounts to actual spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="budgeted" fill="var(--primary)" name="Budgeted" />
                  <Bar dataKey="actual" fill="var(--destructive)" name="Actual Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Budget;
