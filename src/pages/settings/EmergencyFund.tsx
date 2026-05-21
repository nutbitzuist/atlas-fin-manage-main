import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import {
  upsertDefaultSavingsGoal,
} from "@/services/savings-goal-service";
import { getProfileById, updateProfile } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getCashAccountBalancesByUser } from "@/services/cash-account-service";

export default function EmergencyFund() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // Emergency fund data
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);

  const calculateMonthlyExpenses = useCallback(async (userId: string) => {
    try {
      // Get last 3 months of expenses
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2); // Current month + 2 previous months
      threeMonthsAgo.setDate(1);

      const data = await getTransactionsByUserId(
        userId,
        {
          type: "expense",
          startDate: threeMonthsAgo.toISOString(),
        },
        "amount, transaction_date"
      );

      if (data && data.length > 0) {
        // Count only actual months with transactions to avoid dividing by empty months
        const monthsWithData = new Set<string>();
        data.forEach(t => {
          const date = new Date(t.transaction_date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          monthsWithData.add(monthKey);
        });

        const totalExpenses = data.reduce((sum, t) => sum + Number(t.amount), 0);
        const actualMonthCount = Math.max(1, monthsWithData.size);
        const avgMonthly = totalExpenses / actualMonthCount;
        setMonthlyExpenses(avgMonthly);
      }
    } catch (error) {
      console.error("Error calculating monthly expenses:", error);
    }
  }, []);

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      setUserId(session.user.id);

      // Fetch user profile
      const profileData = await getProfileById(session.user.id);
      if (profileData) {
        setUserName(profileData.full_name || "User");
        setTargetMonths(profileData.emergency_fund_target_months || 6);
        setCurrentAmount(profileData.emergency_fund_current_amount || 0);
      }

      // Calculate average monthly expenses
      await calculateMonthlyExpenses(session.user.id);
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [calculateMonthlyExpenses, navigate]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const handleSyncFromBank = async () => {
    if (!userId) return;
    
    try {
      const balances = await getCashAccountBalancesByUser(userId, "active");
      const totalCash = (balances || []).reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
      setCurrentAmount(totalCash);
      toast.success(`Synced! Total cash balance is ฿${totalCash.toLocaleString()}`);
    } catch (error: unknown) {
      console.error("Error syncing from bank accounts:", error);
      toast.error("Failed to sync from bank accounts");
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const targetAmount = monthlyExpenses * targetMonths;

      // 1. Update Profile
      await updateProfile(userId, {
        emergency_fund_target_months: targetMonths,
        emergency_fund_current_amount: currentAmount,
      });

      await upsertDefaultSavingsGoal(
        userId,
        targetAmount,
        currentAmount,
        {
          name: "Emergency Fund",
          category: "Emergency",
          currency: "THB",
        },
      );

      toast.success("Emergency fund updated successfully!");
    } catch (error: unknown) {
      console.error("Error updating emergency fund:", error);
      toast.error(getErrorMessage(error, "Failed to update emergency fund"));
    } finally {
      setSaving(false);
    }
  };

  // Calculate metrics
  const targetAmount = monthlyExpenses * targetMonths;
  const progressPercentage = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const monthsCovered = monthlyExpenses > 0 ? currentAmount / monthlyExpenses : 0;
  const remaining = Math.max(targetAmount - currentAmount, 0);

  const getStatus = () => {
    if (monthsCovered >= targetMonths) return { text: "Excellent", color: "bg-success", icon: CheckCircle2 };
    if (monthsCovered >= targetMonths * 0.75) return { text: "Good Progress", color: "bg-primary", icon: TrendingUp };
    if (monthsCovered >= targetMonths * 0.5) return { text: "Building", color: "bg-warning", icon: AlertCircle };
    return { text: "Getting Started", color: "bg-muted", icon: Shield };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Format currency in Thai Baht
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Emergency Fund</h2>
          <p className="text-muted-foreground">Build your financial safety net</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Current Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(currentAmount)}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {monthsCovered.toFixed(1)} months covered
              </p>
            </CardContent>
          </Card>

          {/* Target Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Target Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(targetAmount)}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {targetMonths} months of expenses
              </p>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <StatusIcon className="h-6 w-6" />
                <span className="text-xl font-semibold">{status.text}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(remaining)} to go
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              {progressPercentage.toFixed(0)}% of your emergency fund goal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercentage} className="h-4" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Saved:</span>
                <span className="font-medium ml-2">{formatCurrency(currentAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium ml-2">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Fund Settings</CardTitle>
            <CardDescription>
              Configure your emergency fund target and track your progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="targetMonths">Target Coverage (Months)</Label>
                <Input
                  id="targetMonths"
                  type="number"
                  min="1"
                  max="24"
                  value={targetMonths}
                  onChange={(e) => setTargetMonths(Math.max(1, Math.min(24, parseInt(e.target.value) || 6)))}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 3-6 months for most people, 6-12 months for self-employed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Current Amount (฿)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground italic">
                    Manual override for your emergency balance
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-primary"
                    onClick={handleSyncFromBank}
                  >
                    Sync from bank accounts
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Based on Your Spending:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Avg. Monthly Expenses:</span>
                  <span className="font-medium ml-2">{formatCurrency(monthlyExpenses)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Recommended Target:</span>
                  <span className="font-medium ml-2">{formatCurrency(targetAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Emergency Fund Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">What qualifies as an emergency?</p>
                <p className="text-sm text-muted-foreground">Job loss, medical expenses, urgent home/car repairs, unexpected travel</p>
              </div>
            </div>
            <div className="flex gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">How to build it faster</p>
                <p className="text-sm text-muted-foreground">Set up automatic transfers, save windfalls, cut unnecessary expenses</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Where to keep it</p>
                <p className="text-sm text-muted-foreground">High-yield savings account - easy to access but separate from daily spending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
