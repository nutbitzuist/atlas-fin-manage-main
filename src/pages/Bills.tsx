import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddBillDialog } from "@/components/dashboard/AddBillDialog";
import { useToast } from "@/hooks/use-toast";
import {
  deleteBill,
  getBillsByUserId,
  payBill
} from "@/services/bill-service";
import { getProfileDisplayName } from "@/services/profile-service";
import {
  Plus,
  Calendar,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  CalendarDays,
  Pencil,
  Trash2,
  Scissors
} from "lucide-react";
import { format, addDays, differenceInDays, parseISO } from "date-fns";

interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  due_date: string;
  category: string | null;
  is_recurring: boolean;
  recurrence_period: string | null;
  is_paid: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  auto_pay: boolean | null;
  account_id: string | null;
}

type BillFilterType = "all" | "recurring" | "one-time";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

const isBillFilterType = (value: string): value is BillFilterType =>
  value === "all" || value === "recurring" || value === "one-time";

const readStoredBillDecisions = (): Record<string, string> => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return {};
    }

    const raw = localStorage.getItem("atlas_bill_decisions");
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
};

const Bills = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filterType, setFilterType] = useState<BillFilterType>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billDecisions, setBillDecisions] = useState<Record<string, string>>(readStoredBillDecisions);

  const fetchUserProfile = useCallback(async (userId: string) => {
    const displayName = await getProfileDisplayName(userId, "User");
    setUserName(displayName);
  }, []);

  const fetchBills = useCallback(async (userId: string) => {
    setBillsLoading(true);
    try {
      const data = await getBillsByUserId(userId, { orderBy: "due_date", ascending: true });
      setBills(data || []);
    } catch (error: unknown) {
      console.error("Error fetching bills:", error);
      toast({
        title: "Error",
        description: "Failed to load bills",
        variant: "destructive",
      });
    } finally {
      setBillsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/login");
        } else {
          fetchUserProfile(session.user.id);
          fetchBills(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      } else {
        fetchUserProfile(session.user.id);
        fetchBills(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchBills, fetchUserProfile, navigate]);

  const handleMarkAsPaid = async (billId: string) => {
    if (!session?.user.id) return;
    
    const result = await payBill(billId, session.user.id);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Bill marked as paid and expense recorded",
      });
      fetchBills(session.user.id);
    } else {
      toast({
        title: "Error",
        description: result.error?.message || "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    if (!session?.user.id) return;

    try {
      await deleteBill(billId, session.user.id);

      toast({
        title: "Success",
        description: "Bill deleted successfully",
      });

      if (session?.user.id) {
        fetchBills(session.user.id);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleBillAdded = () => {
    if (session?.user.id) {
      fetchBills(session.user.id);
    }
    setEditingBill(null);
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setIsAddDialogOpen(true);
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

  const filteredBills = bills.filter((bill) => {
    if (filterType === "all") return true;
    if (filterType === "recurring") return bill.is_recurring;
    if (filterType === "one-time") return !bill.is_recurring;
    return true;
  });

  const upcomingBills = bills
    .filter((bill) => {
      const dueDate = parseISO(bill.due_date);
      const daysUntil = differenceInDays(dueDate, new Date());
      return daysUntil <= 30 && daysUntil >= 0 && !bill.is_paid;
    })
    .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime());
  const calendarDays = Array.from({ length: 31 }, (_, index) => {
    const date = addDays(new Date(), index);
    const dateKey = format(date, "yyyy-MM-dd");
    return {
      date,
      dateKey,
      bills: upcomingBills.filter((bill) => bill.due_date === dateKey),
    };
  });

  const recurringBills = bills.filter((bill) => bill.is_recurring);
  const totalMonthlyRecurring = recurringBills
    .filter((b) => b.recurrence_period === "monthly")
    .reduce((sum, b) => sum + b.amount, 0);
  const getMonthlyEquivalent = (bill: Bill) => {
    if (!bill.is_recurring) return 0;
    if (bill.recurrence_period === "weekly") return bill.amount * 4.33;
    if (bill.recurrence_period === "quarterly") return bill.amount / 3;
    if (bill.recurrence_period === "yearly") return bill.amount / 12;
    return bill.amount;
  };
  const recurringMonthlyEquivalent = recurringBills.reduce((sum, bill) => sum + getMonthlyEquivalent(bill), 0);
  const annualRecurringCost = recurringMonthlyEquivalent * 12;
  const averageRecurringCost = recurringBills.length > 0 ? recurringMonthlyEquivalent / recurringBills.length : 0;
  const optimizerBills = recurringBills
    .map((bill) => ({
      ...bill,
      monthlyEquivalent: getMonthlyEquivalent(bill),
      decision: billDecisions[bill.id] || "review",
    }))
    .sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
  const potentialMonthlySavings = optimizerBills
    .filter((bill) => bill.decision === "cancel")
    .reduce((sum, bill) => sum + bill.monthlyEquivalent, 0);

  const updateBillDecision = (billId: string, decision: string) => {
    const next = { ...billDecisions, [billId]: decision };
    setBillDecisions(next);
    try {
      localStorage.setItem("atlas_bill_decisions", JSON.stringify(next));
    } catch {
      // Ignore storage failures so the optimizer still works in restricted browser modes.
    }
  };

  const getBillStatus = (bill: Bill): "Paid" | "Pending" | "Overdue" => {
    if (bill.is_paid) return "Paid";
    const dueDate = parseISO(bill.due_date);
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil < 0) return "Overdue";
    return "Pending";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge variant="default" className="bg-success">Paid</Badge>;
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "Overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days`;
  };

  const getDaysUntilDueBadge = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date());
    if (days < 0) return "destructive";
    if (days <= 3) return "destructive";
    if (days <= 7) return "secondary";
    return "default";
  };

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Bills & Subscriptions</h2>
            <p className="text-muted-foreground">Manage your recurring payments and subscriptions</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bill
          </Button>
        </div>

        <AddBillDialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingBill(null);
          }}
          onSuccess={handleBillAdded}
          editingBill={editingBill}
        />

        {/* Subscriptions Summary Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Monthly Recurring</p>
                  <p className="text-2xl font-bold">฿{totalMonthlyRecurring.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recurring Bills</p>
                  <p className="text-2xl font-bold">{recurringBills.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Bills (30 days)</p>
                  <p className="text-2xl font-bold">{upcomingBills.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Bill Optimizer */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Subscription & Bill Optimizer
            </CardTitle>
            <CardDescription>
              Review recurring costs, mark decisions, and estimate potential monthly savings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Monthly equivalent</p>
                <p className="text-2xl font-bold">฿{Math.round(recurringMonthlyEquivalent).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Annual recurring cost</p>
                <p className="text-2xl font-bold">฿{Math.round(annualRecurringCost).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Potential savings</p>
                <p className="text-2xl font-bold text-success">฿{Math.round(potentialMonthlySavings).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Needs review</p>
                <p className="text-2xl font-bold">{optimizerBills.filter((bill) => bill.decision === "review").length}</p>
              </div>
            </div>

            {optimizerBills.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                Add recurring bills or subscriptions to unlock optimization suggestions.
              </div>
            ) : (
              <div className="space-y-3">
                {optimizerBills.slice(0, 6).map((bill) => {
                  const highImpact = bill.monthlyEquivalent > averageRecurringCost * 1.25;
                  return (
                    <div key={bill.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{bill.name}</h3>
                          {highImpact && <Badge variant="secondary">High impact</Badge>}
                          <Badge variant={bill.decision === "cancel" ? "destructive" : bill.decision === "keep" ? "default" : "outline"}>
                            {bill.decision}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bill.category || "Uncategorized"} • ฿{Math.round(bill.monthlyEquivalent).toLocaleString()}/mo equivalent • ฿{Math.round(bill.monthlyEquivalent * 12).toLocaleString()}/yr
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant={bill.decision === "keep" ? "default" : "outline"} size="sm" onClick={() => updateBillDecision(bill.id, "keep")}>
                          Keep
                        </Button>
                        <Button variant={bill.decision === "review" ? "default" : "outline"} size="sm" onClick={() => updateBillDecision(bill.id, "review")}>
                          Review
                        </Button>
                        <Button variant={bill.decision === "cancel" ? "destructive" : "outline"} size="sm" onClick={() => updateBillDecision(bill.id, "cancel")}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bills Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Upcoming Bills (Next 30 Days)</CardTitle>
                  <CardDescription>Bills and subscriptions due soon</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "list" ? (
                billsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : upcomingBills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No upcoming bills in the next 30 days</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBills.map((bill) => {
                      const dueDate = parseISO(bill.due_date);
                      const status = getBillStatus(bill);
                      return (
                        <div
                          key={bill.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{bill.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {bill.category || "Uncategorized"}
                                {bill.is_recurring && ` • ${bill.recurrence_period}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="font-semibold">฿{bill.amount.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {bill.is_recurring ? bill.recurrence_period : "One-time"}
                              </p>
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="text-sm font-medium">{format(dueDate, "MMM dd")}</p>
                              <Badge variant={getDaysUntilDueBadge(dueDate)} className="text-xs">
                                {getDaysUntilDue(dueDate)}
                              </Badge>
                            </div>
                            <div className="min-w-[80px]">
                              {getStatusBadge(status)}
                            </div>
                            {status === "Pending" && (
                              <Button size="sm" onClick={() => handleMarkAsPaid(bill.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {upcomingBills.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No upcoming bills in the next 30 days</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {calendarDays
                        .filter((day) => day.bills.length > 0)
                        .map((day) => (
                          <div key={day.dateKey} className="rounded-lg border p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{format(day.date, "EEE, MMM d")}</p>
                                <p className="text-xs text-muted-foreground">{getDaysUntilDue(day.date)}</p>
                              </div>
                              <Badge variant={getDaysUntilDueBadge(day.date)}>{day.bills.length}</Badge>
                            </div>
                            <div className="space-y-2">
                              {day.bills.map((bill) => {
                                const status = getBillStatus(bill);
                                return (
                                  <div key={bill.id} className="rounded-md bg-muted/50 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-medium">{bill.name}</p>
                                        <p className="text-xs text-muted-foreground">{bill.category || "Uncategorized"}</p>
                                      </div>
                                      <p className="whitespace-nowrap text-sm font-semibold">฿{bill.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                      {getStatusBadge(status)}
                                      {status === "Pending" && (
                                        <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(bill.id)}>
                                          Mark paid
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bills & Subscriptions List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Bills & Subscriptions</CardTitle>
                <CardDescription>Manage your recurring payments</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Tabs value={filterType} onValueChange={(value) => {
                  if (isBillFilterType(value)) setFilterType(value);
                }}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="recurring">Recurring</TabsTrigger>
                    <TabsTrigger value="one-time">One-time</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {billsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No bills found</p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Bill
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Auto-pay</TableHead>
                    <TableHead>Next Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => {
                    const dueDate = parseISO(bill.due_date);
                    const status = getBillStatus(bill);
                    return (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.name}</TableCell>
                        <TableCell>{bill.category || "Uncategorized"}</TableCell>
                        <TableCell className="text-right">฿{bill.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {bill.is_recurring ? (
                            <Badge variant="default">{bill.recurrence_period}</Badge>
                          ) : (
                            <Badge variant="secondary">One-time</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {bill.auto_pay ? (
                            <Badge variant="default" className="bg-primary/20 text-primary border-primary/20">Enabled</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Off</span>
                          )}
                        </TableCell>
                        <TableCell>{format(dueDate, "MMM dd, yyyy")}</TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(bill)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteBill(bill.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Bills;
