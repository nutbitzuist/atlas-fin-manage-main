import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddSavingsGoalDialog } from "@/components/dashboard/AddSavingsGoalDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Home,
  Car,
  GraduationCap,
  Plane,
  Heart,
  Briefcase,
  DollarSign,
  Calendar,
  PiggyBank,
  Trash2,
  Shield,
  Save,
  Clock
} from "lucide-react";
import { format, differenceInMonths, differenceInDays, parseISO } from "date-fns";
import { getErrorMessage } from "@/utils/errors";
import { toLocalDateInput } from "@/utils/date";
import { getProfileById, updateProfile } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import {
  addSavingsGoalContribution,
  deleteSavingsGoal,
  getSavingsGoalsByUserId,
  type SavingsGoalRow,
} from "@/services/savings-goal-service";

const SavingsGoals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddContributionOpen, setIsAddContributionOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalRow | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [goals, setGoals] = useState<SavingsGoalRow[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState<number>(0);
  const [monthlyInvestmentTarget, setMonthlyInvestmentTarget] = useState<number>(0);
  const [monthlySaved, setMonthlySaved] = useState<number>(0);
  const [monthlyInvested, setMonthlyInvested] = useState<number>(0);
  const [isSavingMonthlySavings, setIsSavingMonthlySavings] = useState(false);
  const [isSavingMonthlyInvestment, setIsSavingMonthlyInvestment] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    const profile = await getProfileById(userId);

    if (profile) {
      setUserName(profile.full_name || "User");
      setMonthlySavingsTarget(profile.monthly_savings_target || 0);
      setMonthlyInvestmentTarget(profile.monthly_investment_target || 0);
    }
  }, []);

  const fetchGoals = useCallback(async (userId: string) => {
    setGoalsLoading(true);
    try {
      // 1. Fetch Goals
      const goalsData = await getSavingsGoalsByUserId(userId);
      setGoals(goalsData || []);

      // 2. Fetch this month's savings contributions
      const now = new Date();
      const firstDay = toLocalDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
      const lastDay = toLocalDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));

      const txData = await getTransactionsByUserId(
        userId,
        {
          type: "transfer",
          startDate: firstDay,
          endDate: lastDay,
        },
        "amount, category"
      );

      const transactionData = txData?.filter((tx) => tx.category === "Savings" || tx.category === "Investment") || [];
      if (transactionData.length > 0) {
        const totalSaved = transactionData
          .filter(tx => tx.category === "Savings")
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        const totalInvested = transactionData
          .filter(tx => tx.category === "Investment")
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        
        setMonthlySaved(totalSaved);
        setMonthlyInvested(totalInvested);
      }
    } catch (error: unknown) {
      console.error("Error fetching savings goals:", error);
      toast({
        title: "Error",
        description: "Failed to load savings goals",
        variant: "destructive",
      });
    } finally {
      setGoalsLoading(false);
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
          fetchGoals(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      } else {
        fetchUserProfile(session.user.id);
        fetchGoals(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchGoals, fetchUserProfile, navigate]);

  const handleSaveMonthlySavings = async () => {
    if (!session?.user?.id) return;
    setIsSavingMonthlySavings(true);
    try {
      await updateProfile(session.user.id, {
        monthly_savings_target: monthlySavingsTarget,
      });

      toast({
        title: "Saved",
        description: "Your monthly savings target has been updated",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save monthly savings target"),
        variant: "destructive",
      });
    } finally {
      setIsSavingMonthlySavings(false);
    }
  };

  const handleSaveMonthlyInvestment = async () => {
    if (!session?.user?.id) return;
    setIsSavingMonthlyInvestment(true);
    try {
      await updateProfile(session.user.id, {
        monthly_investment_target: monthlyInvestmentTarget,
      });

      toast({
        title: "Saved",
        description: "Your monthly investment target has been updated",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save monthly investment target"),
        variant: "destructive",
      });
    } finally {
      setIsSavingMonthlyInvestment(false);
    }
  };

  const handleGoalAdded = () => {
    if (session?.user.id) {
      fetchGoals(session.user.id);
    }
  };

  const handleDeleteGoal = async (goalId: string, isDefault?: boolean) => {
    if (isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Emergency Fund is a default goal and cannot be deleted. Update the target instead.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm("Are you sure you want to delete this savings goal?")) return;
    if (!session?.user.id) return;

    try {
      await deleteSavingsGoal(session.user.id, goalId);

      toast({
        title: "Success",
        description: "Savings goal deleted successfully",
      });

      if (session?.user.id) {
        fetchGoals(session.user.id);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete savings goal"),
        variant: "destructive",
      });
    }
  };

  const handleAddContribution = async () => {
    if (!selectedGoal || !contributionAmount) return;
    if (!session?.user.id) return;

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Update the savings goal
      await addSavingsGoalContribution(session.user.id, selectedGoal, amount);

      toast({
        title: "Success",
        description: "Contribution added successfully",
      });

      setIsAddContributionOpen(false);
      setContributionAmount("");
      setSelectedGoal(null);

      if (session?.user.id) {
        fetchGoals(session.user.id);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to add contribution"),
        variant: "destructive",
      });
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

  // Overall goals calculations
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const getGoalProgress = (goal: SavingsGoalRow) => {
    return goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  };

  const getRequiredMonthlySavings = (goal: SavingsGoalRow) => {
    if (!goal.target_date) return 0;
    const remaining = goal.target_amount - goal.current_amount;
    const targetDate = parseISO(goal.target_date);
    const monthsRemaining = Math.max(1, differenceInMonths(targetDate, new Date()));
    return remaining / monthsRemaining;
  };

  const getGoalPlan = (goal: SavingsGoalRow) => {
    const progress = getGoalProgress(goal);
    const remaining = Math.max(0, goal.target_amount - goal.current_amount);
    const targetDate = goal.target_date ? parseISO(goal.target_date) : null;
    const createdAt = goal.created_at ? parseISO(goal.created_at) : new Date();
    const totalDays = targetDate ? Math.max(1, differenceInDays(targetDate, createdAt)) : null;
    const elapsedDays = targetDate ? Math.max(0, differenceInDays(new Date(), createdAt)) : null;
    const expectedProgress = totalDays && elapsedDays !== null ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;
    const monthsRemaining = targetDate ? Math.max(0, differenceInMonths(targetDate, new Date())) : null;
    const requiredMonthly = targetDate ? remaining / Math.max(1, monthsRemaining || 1) : 0;
    const status = progress >= 100
      ? "complete"
      : !targetDate
      ? "no_date"
      : progress + 5 >= expectedProgress
      ? "on_track"
      : "behind";

    return {
      expectedProgress,
      monthsRemaining,
      progress,
      remaining,
      requiredMonthly,
      status,
    };
  };

  const isOnTrack = (goal: SavingsGoalRow) => {
    return ["complete", "on_track", "no_date"].includes(getGoalPlan(goal).status);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "House":
        return Home;
      case "Car":
        return Car;
      case "Education":
        return GraduationCap;
      case "Travel":
        return Plane;
      case "Retirement":
        return Briefcase;
      case "Emergency":
        return Shield;
      default:
        return Target;
    }
  };

  // Separate default and custom goals
  const defaultGoals = goals.filter(g => g.is_default);
  const customGoals = goals.filter(g => !g.is_default);
  const plannedGoals = goals
    .map((goal) => ({ goal, plan: getGoalPlan(goal) }))
    .sort((a, b) => {
      if (a.goal.is_default && !b.goal.is_default) return -1;
      if (!a.goal.is_default && b.goal.is_default) return 1;
      if (a.plan.status === "behind" && b.plan.status !== "behind") return -1;
      if (a.plan.status !== "behind" && b.plan.status === "behind") return 1;
      return b.plan.requiredMonthly - a.plan.requiredMonthly;
    });
  const totalRequiredMonthly = plannedGoals.reduce((sum, item) => sum + item.plan.requiredMonthly, 0);
  const goalFundingGap = totalRequiredMonthly - monthlySavingsTarget;
  const behindGoals = plannedGoals.filter((item) => item.plan.status === "behind");
  const availableMonthlySavings = monthlySavingsTarget || monthlySaved || 0;
  const allocationBase = plannedGoals.filter((item) => item.plan.remaining > 0 && item.plan.requiredMonthly > 0);
  const totalAllocationWeight = allocationBase.reduce((sum, item) => sum + item.plan.requiredMonthly, 0);

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Savings Goals</h2>
            <p className="text-muted-foreground">Track and achieve your financial goals</p>
          </div>
          <Button onClick={() => setIsAddGoalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>

        <AddSavingsGoalDialog
          open={isAddGoalOpen}
          onOpenChange={setIsAddGoalOpen}
          onSuccess={handleGoalAdded}
        />

        {/* Goals Overview Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Target Amount</p>
                  <p className="text-2xl font-bold">฿{totalTarget.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Saved Amount</p>
                  <p className="text-2xl font-bold text-success">฿{totalSaved.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Progress</p>
                  <p className="text-2xl font-bold">{overallProgress.toFixed(1)}%</p>
                  <Progress value={overallProgress} className="mt-2 h-2" />
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goal Planning Engine */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goal Planning Engine
            </CardTitle>
            <CardDescription>
              See whether your deadlines are realistic and where your monthly savings should go first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Required / Month</p>
                <p className="text-2xl font-bold">฿{Math.ceil(totalRequiredMonthly).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Committed Target</p>
                <p className="text-2xl font-bold">฿{monthlySavingsTarget.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Funding Gap</p>
                <p className={`text-2xl font-bold ${goalFundingGap > 0 ? "text-destructive" : "text-success"}`}>
                  {goalFundingGap > 0 ? "฿" : ""}{goalFundingGap > 0 ? Math.ceil(goalFundingGap).toLocaleString() : "Covered"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Goals Behind</p>
                <p className={`text-2xl font-bold ${behindGoals.length > 0 ? "text-warning" : "text-success"}`}>
                  {behindGoals.length}
                </p>
              </div>
            </div>

            {plannedGoals.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                Create a goal with a target date to unlock monthly contribution planning.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-3">
                  <h3 className="font-semibold">Deadline Feasibility</h3>
                  {plannedGoals.slice(0, 5).map(({ goal, plan }) => (
                    <div key={goal.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{goal.name}</p>
                            <Badge
                              variant={
                                plan.status === "behind"
                                  ? "destructive"
                                  : plan.status === "complete"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {plan.status === "no_date" ? "no date" : plan.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {plan.remaining > 0 ? `Remaining ฿${plan.remaining.toLocaleString()}` : "Goal funded"}
                            {plan.monthsRemaining !== null ? ` • ${plan.monthsRemaining} months left` : ""}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-xs text-muted-foreground">Required monthly</p>
                          <p className="font-semibold">฿{Math.ceil(plan.requiredMonthly).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2">
                        <Progress value={plan.progress} />
                        {goal.target_date && (
                          <p className="text-xs text-muted-foreground">
                            Expected progress by today: {plan.expectedProgress.toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Suggested Monthly Allocation</h3>
                  {availableMonthlySavings <= 0 || allocationBase.length === 0 ? (
                    <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                      Set a monthly savings target and add target dates to generate allocation suggestions.
                    </div>
                  ) : (
                    allocationBase.slice(0, 5).map(({ goal, plan }) => {
                      const allocation = totalAllocationWeight > 0
                        ? (plan.requiredMonthly / totalAllocationWeight) * availableMonthlySavings
                        : 0;
                      return (
                        <div key={goal.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
                          <div>
                            <p className="font-medium">{goal.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {goal.is_default ? "Essential goal" : goal.category || "Savings goal"}
                            </p>
                          </div>
                          <Badge variant="outline">฿{Math.ceil(allocation).toLocaleString()}</Badge>
                        </div>
                      );
                    })
                  )}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex gap-2">
                      <Clock className="h-4 w-4 text-primary mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        {goalFundingGap > 0
                          ? `Increase your monthly savings target by about ฿${Math.ceil(goalFundingGap).toLocaleString()} or extend lower-priority deadlines.`
                          : "Your committed monthly target can cover the current dated goals."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Savings Target Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              Monthly Savings Target
            </CardTitle>
            <CardDescription>
              How much do you commit to save each month? This helps track your savings rate accurately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="monthlySavings">Amount (฿)</Label>
                <Input
                  id="monthlySavings"
                  type="number"
                  placeholder="e.g., 10000"
                  value={monthlySavingsTarget || ""}
                  onChange={(e) => setMonthlySavingsTarget(parseFloat(e.target.value) || 0)}
                  className="mt-2 text-lg"
                />
              </div>
              <Button
                onClick={handleSaveMonthlySavings}
                disabled={isSavingMonthlySavings}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSavingMonthlySavings ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              This is the amount you actively set aside for savings/investments, not just leftover money.
            </p>
            
            {monthlySavingsTarget > 0 && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <div className="flex justify-between items-ends mb-2">
                  <div>
                    <p className="text-sm font-medium">This Month's Progress</p>
                    <p className="text-xs text-muted-foreground">Based on your tracked contributions this month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">฿{monthlySaved.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">of ฿{monthlySavingsTarget.toLocaleString()}</p>
                  </div>
                </div>
                <Progress 
                  value={Math.min(100, (monthlySaved / monthlySavingsTarget) * 100)} 
                  className="h-2" 
                />
                <p className="text-xs text-right mt-1.5 text-muted-foreground">
                  {((monthlySaved / monthlySavingsTarget) * 100).toFixed(1)}% achieved
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Investment Target Card */}
        <Card className="mb-8 border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Monthly Investment Target
            </CardTitle>
            <CardDescription>
              How much do you aim to invest each month? This tracks your active wealth building progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="monthlyInvestment">Amount (฿)</Label>
                <Input
                  id="monthlyInvestment"
                  type="number"
                  placeholder="e.g., 20000"
                  value={monthlyInvestmentTarget || ""}
                  onChange={(e) => setMonthlyInvestmentTarget(parseFloat(e.target.value) || 0)}
                  className="mt-2 text-lg"
                />
              </div>
              <Button
                onClick={handleSaveMonthlyInvestment}
                disabled={isSavingMonthlyInvestment}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="h-4 w-4" />
                {isSavingMonthlyInvestment ? "Saving..." : "Save"}
              </Button>
            </div>
            
            {monthlyInvestmentTarget > 0 && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <div className="flex justify-between items-ends mb-2">
                  <div>
                    <p className="text-sm font-medium">Investment Progress</p>
                    <p className="text-xs text-muted-foreground">Transactions in "Investment" category this month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600">฿{monthlyInvested.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">of ฿{monthlyInvestmentTarget.toLocaleString()}</p>
                  </div>
                </div>
                <Progress 
                  value={Math.min(100, (monthlyInvested / monthlyInvestmentTarget) * 100)} 
                  className="h-2" 
                />
                <p className="text-xs text-right mt-1.5 text-muted-foreground">
                  {((monthlyInvested / monthlyInvestmentTarget) * 100).toFixed(1)}% achieved
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Fund Section - Always Show */}
        {defaultGoals.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Essential Goals
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {defaultGoals.map((goal) => {
                const Icon = getCategoryIcon(goal.category || "");
                const progress = getGoalProgress(goal);
                const requiredMonthlySavings = getRequiredMonthlySavings(goal);
                const remaining = goal.target_amount - goal.current_amount;

                return (
                  <Card key={goal.id} className="hover:shadow-lg transition-shadow border-primary/30 bg-primary/5">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{goal.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 border-primary/50">
                              Essential
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-semibold">฿{goal.target_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Saved</p>
                          <p className="font-semibold text-success">฿{goal.current_amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={`font-semibold ${progress >= 100 ? 'text-green-600' : ''}`}>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setIsAddContributionOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Contribution
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Savings Goals Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Your Goals</h3>
          {goalsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : customGoals.length === 0 && defaultGoals.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Savings Goals Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start saving for what matters most to you
                </p>
                <Button onClick={() => setIsAddGoalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </div>
            </Card>
          ) : customGoals.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {customGoals.map((goal) => {
                const Icon = getCategoryIcon(goal.category || "");
                const progress = getGoalProgress(goal);
                const requiredMonthlySavings = getRequiredMonthlySavings(goal);
                const onTrack = isOnTrack(goal);
                const remaining = goal.target_amount - goal.current_amount;

                return (
                  <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{goal.name}</CardTitle>
                            {goal.category && (
                              <Badge variant="secondary" className="mt-1">
                                {goal.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {onTrack ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-semibold">฿{goal.target_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Saved</p>
                          <p className="font-semibold text-success">฿{goal.current_amount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {goal.target_date && (
                        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                          <div>
                            <p className="text-muted-foreground">Target Date</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(goal.target_date), "MMM yyyy")}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Required/Month</p>
                            <p className="font-semibold">฿{Math.ceil(requiredMonthlySavings).toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setIsAddContributionOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Contribution
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Add more goals to track your savings for specific targets like a house, car, or vacation.
            </p>
          )}
        </div>

        {/* Add Contribution Dialog */}
        <Dialog open={isAddContributionOpen} onOpenChange={setIsAddContributionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contribution</DialogTitle>
              <DialogDescription>
                Add money to your {selectedGoal?.name} goal
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contributionAmount">Amount (฿)</Label>
                <Input
                  id="contributionAmount"
                  type="number"
                  placeholder="0.00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsAddContributionOpen(false);
                setContributionAmount("");
                setSelectedGoal(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddContribution}>Add Contribution</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SavingsGoals;
