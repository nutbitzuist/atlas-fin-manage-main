import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";

import { useYear } from "@/contexts/YearContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Search, Filter, TrendingUp, Calendar, DollarSign, Pencil, Trash2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import {
  deactivateRecurringTemplateByName,
  upsertBillFromTransaction,
} from "@/services/bill-service";
import SEO from "@/components/SEO";
import { getErrorMessage } from "@/utils/errors";
import { toLocalDateInput } from "@/utils/date";
import {
  createTransaction,
  deleteTransaction,
  getTransactionsByUserId,
  updateTransaction,
} from "@/services/transaction-service";
import { getProfileDisplayName } from "@/services/profile-service";
import { getCashAccountsByUser } from "@/services/cash-account-service";
import { getCategoryNamesByUserAndType } from "@/services/category-service";

// Chart colors
const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

interface IncomeTransaction {
  id: string;
  transaction_date: string;
  category: string;
  amount: number;
  source: string | null;
  account_id: string | null;
  account_name: string | null;
  description: string | null;
  is_recurring: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_type: string;
  account_number: string | null;
}

export default function Income() {
  const navigate = useNavigate();
  const { toast: showToast } = useToast();
  const { selectedYear, selectedMonth } = useYear();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<IncomeTransaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: toLocalDateInput(new Date()),
    category: "",
    amount: "",
    source: "",
    account: "",
    description: "",
    isRecurring: false,
    recurrencePeriod: "monthly"
  });

  const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Fetch user profile
      setUserName(await getProfileDisplayName(session.user.id, "User"));

      // Fetch transactions, bank accounts, and categories
      await Promise.all([fetchTransactions(), fetchBankAccounts(), fetchCategories()]);
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const categoryNames = await getCategoryNamesByUserAndType(user.id, "income");
      setCategories(categoryNames);
    } catch (error: unknown) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getTransactionsByUserId(user.id, {
        type: "income",
        orderBy: "transaction_date",
        ascending: false,
      });

      setTransactions(data || []);
    } catch (error: unknown) {
      showToast({
        title: "Error",
        description: "Failed to load income transactions",
        variant: "destructive",
      });
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cashAccounts = await getCashAccountsByUser(user.id, "active");
      setBankAccounts(cashAccounts);
    } catch (error: unknown) {
      console.error("Error loading bank accounts:", error);
    }
  };

  // Calculate summary statistics
  const calculateThisMonthIncome = () => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      const matchesYear = transactionDate.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === null || (transactionDate.getMonth() + 1) === selectedMonth;
      return matchesYear && matchesMonth;
    }).reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateLastMonthIncome = () => {
    const referenceDate = selectedMonth 
      ? new Date(selectedYear, selectedMonth - 1, 1) 
      : new Date();
    
    const lastMonthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate.getMonth() === lastMonthDate.getMonth() &&
             transactionDate.getFullYear() === lastMonthDate.getFullYear();
    }).reduce((sum, t) => sum + t.amount, 0);
  };
    

  const calculateAverageMonthlyIncome = () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6);
    const recentTransactions = transactions.filter(t => new Date(t.transaction_date) >= sixMonthsAgo);

    if (recentTransactions.length === 0) return 0;
    const total = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    return Math.round(total / 6);
  };

  // Prepare data for pie chart (filtered by selected period)
  const getCategoryChartData = () => {
    const categoryTotals: { [key: string]: number } = {};
    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      const matchesYear = transactionDate.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === null || (transactionDate.getMonth() + 1) === selectedMonth;
      return matchesYear && matchesMonth;
    });

    filtered.forEach(t => {
      const cat = t.category || "Other";
      if (categoryTotals[cat]) {
        categoryTotals[cat] += t.amount;
      } else {
        categoryTotals[cat] = t.amount;
      }
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Filter and search transactions
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      const matchesSearch = (t.source || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      const matchesAccount = filterAccount === "all" || t.account_name === filterAccount;

      const matchesYear = transactionDate.getFullYear() === selectedYear;
      const matchesMonth = selectedMonth === null || (transactionDate.getMonth() + 1) === selectedMonth;

      return matchesSearch && matchesCategory && matchesAccount && matchesYear && matchesMonth;
    });
  };

  // Pagination
  const getPaginatedTransactions = () => {
    const filtered = getFilteredTransactions();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredTransactions().length / itemsPerPage);

  // Get unique accounts
  const getUniqueAccounts = () => {
    return Array.from(new Set(transactions.map(t => t.account_name).filter(Boolean)));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedSource = formData.source.trim();
    if (
      !formData.category ||
      !formData.amount ||
      !normalizedSource ||
      !formData.account
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Find the selected account
      const selectedAccount = bankAccounts.find(acc => acc.id === formData.account);
      const accountName = selectedAccount
        ? `${selectedAccount.bank_name} - ${selectedAccount.account_type}`
        : null;

      const transactionData = {
        user_id: user.id,
        type: "income",
        transaction_date: formData.date,
        category: formData.category,
        amount: parseFloat(formData.amount),
        source: normalizedSource,
        account_id: formData.account || null,
        account_name: accountName,
        description: formData.description || null,
        is_recurring: formData.isRecurring,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, user.id, transactionData);

        showToast({
          title: "Success",
          description: "Income transaction updated successfully",
        });
      } else {
        await createTransaction(transactionData);

        showToast({
          title: "Success",
          description: "Income transaction added successfully",
        });
      }

      // Handle Recurring Automation linkage
      if (formData.isRecurring) {
        const previousSource = editingTransaction?.source || null;
        await upsertBillFromTransaction(
          transactionData,
          formData.recurrencePeriod,
          'income',
          user.id,
          previousSource,
        );
        showToast({
          title: "Automation Created",
          description: `This recurring income will now be automatically recorded ${formData.recurrencePeriod}.`,
        });
      } else if (editingTransaction?.is_recurring) {
        await deactivateRecurringTemplateByName(user.id, "income", editingTransaction.source || transactionData.source);
      }

      await fetchTransactions();

      // Reset form
      setFormData({
        date: toLocalDateInput(new Date()),
        category: "",
        amount: "",
        source: "",
        account: "",
        description: "",
        isRecurring: false,
        recurrencePeriod: "monthly"
      });

      setEditingTransaction(null);
      setIsDialogOpen(false);
    } catch (error: unknown) {
      showToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (transaction: IncomeTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.transaction_date,
      category: transaction.category,
      amount: transaction.amount.toString(),
      source: transaction.source || "",
      account: transaction.account_id || "",
      description: transaction.description || "",
      isRecurring: transaction.is_recurring,
      recurrencePeriod: "monthly"
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteTransaction(transactionToDelete, user.id);

      showToast({
        title: "Success",
        description: "Income transaction deleted successfully",
      });

      await fetchTransactions();
    } catch (error: unknown) {
      showToast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const thisMonthIncome = calculateThisMonthIncome();
  const lastMonthIncome = calculateLastMonthIncome();
  const averageIncome = calculateAverageMonthlyIncome();
  const categoryData = getCategoryChartData();

  return (
    <Layout userName={userName}>
      <SEO
        title="Income Management"
        description="Track all your income sources including salary, business income, investments, and passive income. Visualize income distribution and monitor monthly income trends."
        keywords="income tracker, salary tracking, income sources, business income, investment income, passive income, income management"
        canonical="/income"
      />
      <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Income</h1>
          <p className="text-muted-foreground mt-1">Track and manage your income sources</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? "Edit Income Transaction" : "Add Income Transaction"}</DialogTitle>
              <DialogDescription>
                {editingTransaction ? "Update your income transaction details" : "Record a new income transaction to track your earnings"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (฿) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categories.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No categories found. Please add income categories in Settings.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source/Payer *</Label>
                  <Input
                    id="source"
                    placeholder="e.g., Company Name, Client Name"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Account Received Into *</Label>
                  <Select value={formData.account} onValueChange={(value) => setFormData({ ...formData, account: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bank_name} - {account.account_type}
                          {account.account_number && ` (${account.account_number})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description/Notes</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked as boolean })}
                  />
                  <Label htmlFor="recurring" className="text-sm font-normal cursor-pointer">
                    This is a recurring income
                  </Label>
                </div>

                {formData.isRecurring && (
                  <div className="grid gap-2 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="recurrence" className="text-sm">Frequency</Label>
                    <Select
                      value={formData.recurrencePeriod}
                      onValueChange={(value) => setFormData({ ...formData, recurrencePeriod: value })}
                    >
                      <SelectTrigger id="recurrence" className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingTransaction(null);
                  setFormData({
                    date: toLocalDateInput(new Date()),
                    category: "",
                    amount: "",
                    source: "",
                    account: "",
                    description: "",
                    isRecurring: false,
                    recurrencePeriod: "monthly"
                  });
                }}>
                  Cancel
                </Button>
                <Button type="submit">{editingTransaction ? "Update Income" : "Add Income"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              {selectedMonth ? `${[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ][selectedMonth - 1]} ${selectedYear}` : `Income in ${selectedYear}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">฿{thisMonthIncome.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {lastMonthIncome > 0
                ? `${((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1)}% vs last month`
                : thisMonthIncome > 0
                  ? 'New income this month'
                  : 'No income data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last Month's Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">฿{lastMonthIncome.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Average Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">฿{averageIncome.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 6 months</p>
          </CardContent>
        </Card>
      </div>

      {/* Income by Category Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Income by Category</CardTitle>
          <CardDescription>Distribution of income across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'Amount']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by source or description..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {getUniqueAccounts().map((acc) => (
                  <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Income Transactions</CardTitle>
          <CardDescription>
            {getFilteredTransactions().length} transaction(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getPaginatedTransactions().map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                    {transaction.is_recurring && (
                      <Badge variant="secondary" className="ml-2">Recurring</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-success">
                    ฿{transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{transaction.source || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{transaction.account_name || "-"}</TableCell>
                  <TableCell className="text-sm">{transaction.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteClick(transaction.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this income transaction from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </Layout>
  );
}
