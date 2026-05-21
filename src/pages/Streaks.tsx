import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { differenceInCalendarDays, startOfMonth, startOfWeek, subDays } from "date-fns";
import { ArrowRight, CheckCircle2, Flame, RefreshCw, Target } from "lucide-react";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getProfileDisplayName } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getBillsByUserId } from "@/services/bill-service";
import { getDailyBriefsByUserAndDateRange } from "@/services/daily-brief-service";
import { getMonthlyUpdatesByUser } from "@/services/monthly-update-service";
import { getWeeklyReviewsByUser } from "@/services/weekly-review-service";

type Streak = {
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  href: string;
  cta: string;
};

const toDateInput = (date: Date) => date.toISOString().split("T")[0];

const calculateDailyStreak = (dates: string[]) => {
  const completed = new Set(dates);
  let cursor = new Date();
  let streak = 0;

  while (completed.has(toDateInput(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
};

export default function Streaks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [streaks, setStreaks] = useState<Streak[]>([]);

  const currentWeekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const currentMonthStart = useMemo(() => startOfMonth(new Date()), []);

  const loadStreaks = useCallback(async () => {
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        navigate("/login");
        return;
      }

      const thirtyDaysAgo = toDateInput(subDays(new Date(), 30));
      const twelveWeeksAgo = toDateInput(subDays(currentWeekStart, 84));

      const displayName = await getProfileDisplayName(userId, "User");
      const [dailyResult, weeklyResult, monthlyResult, billsResult, transfersResult] = await Promise.all([
        getDailyBriefsByUserAndDateRange(userId, {
          startDate: thirtyDaysAgo,
          status: "completed",
        }),
        getWeeklyReviewsByUser(userId, {
          startDate: twelveWeeksAgo,
          status: "completed",
          ascending: false,
        }),
        getMonthlyUpdatesByUser(userId, {
          status: "completed",
          order: {
            ascending: false,
            limit: 12,
          },
        }),
        getBillsByUserId(userId, {
          dueDateFrom: toDateInput(currentMonthStart),
          orderBy: "due_date",
          ascending: true,
        }),
        getTransactionsByUserId(userId, {
          startDate: toDateInput(currentMonthStart),
        }),
      ]);

      setUserName(displayName);

      const dailyDates = (dailyResult || []).map((row) => row.brief_date);
      const dailyStreak = calculateDailyStreak(dailyDates);

      const weeklyStarts = new Set((weeklyResult || []).map((row) => row.week_start));
      let weekCursor = currentWeekStart;
      let weeklyStreak = 0;
      while (weeklyStarts.has(toDateInput(weekCursor))) {
        weeklyStreak += 1;
        weekCursor = subDays(weekCursor, 7);
      }

      const monthlyStarts = new Set((monthlyResult || []).map((row) => row.month));
      let monthCursor = currentMonthStart;
      let monthlyStreak = 0;
      while (monthlyStarts.has(toDateInput(monthCursor))) {
        monthlyStreak += 1;
        monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1);
      }

      const bills = billsResult || [];
      const billsPaid = bills.filter((bill) => bill.is_paid).length;
      const billCompletion = bills.length > 0 ? Math.round((billsPaid / bills.length) * 100) : 0;
      const transferCount = (transfersResult || []).filter((tx) => tx.type === "transfer" && ["Savings", "Investment"].includes(tx.category || "")).length;
      const daysSinceFirstDaily = dailyDates.length > 0
        ? differenceInCalendarDays(new Date(), new Date(dailyDates[dailyDates.length - 1]))
        : 0;

      setStreaks([
        {
          title: "Daily Brief Streak",
          description: "Complete your daily finance brief to keep money decisions visible.",
          current: dailyStreak,
          target: 7,
          unit: "days",
          href: "/daily-brief",
          cta: "Open brief",
        },
        {
          title: "Weekly Review Streak",
          description: "Review the week, identify spending shifts, and choose next week's focus.",
          current: weeklyStreak,
          target: 4,
          unit: "weeks",
          href: "/weekly-review",
          cta: "Open review",
        },
        {
          title: "Monthly Close Streak",
          description: "Complete the monthly update and preserve your net worth history.",
          current: monthlyStreak,
          target: 3,
          unit: "months",
          href: "/monthly-update",
          cta: "Close month",
        },
        {
          title: "Bill Completion",
          description: "Keep this month's due bills reviewed and paid.",
          current: billCompletion,
          target: 100,
          unit: "%",
          href: "/bills",
          cta: "Review bills",
        },
        {
          title: "Savings Momentum",
          description: "Record savings or investment transfers this month.",
          current: transferCount,
          target: 4,
          unit: "transfers",
          href: "/savings-goals",
          cta: "Review goals",
        },
        {
          title: "Finance Awareness",
          description: "Days since your first completed daily brief in this cycle.",
          current: Math.max(dailyStreak, daysSinceFirstDaily),
          target: 30,
          unit: "days",
          href: "/financial-insights",
          cta: "Open insights",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [currentMonthStart, currentWeekStart, navigate]);

  useEffect(() => {
    loadStreaks();
  }, [loadStreaks]);

  if (loading) {
    return (
      <Layout userName={userName}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  const bestStreak = streaks.reduce((best, streak) => (streak.current > best.current ? streak : best), streaks[0]);

  return (
    <Layout userName={userName}>
      <SEO title="Financial Streaks" description="Track daily, weekly, monthly, bill, and savings consistency streaks." canonical="/streaks" />
      <div className="container mx-auto space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Flame className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Financial Streaks</h1>
            </div>
            <p className="mt-2 text-muted-foreground">Build consistency around the routines that keep money under control.</p>
          </div>
          <Button variant="outline" onClick={loadStreaks}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {bestStreak && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Best current streak: {bestStreak.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {bestStreak.current} {bestStreak.unit} toward a target of {bestStreak.target}.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to={bestStreak.href}>
                  Keep it going
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {streaks.map((streak) => {
            const progress = Math.min(100, streak.target > 0 ? (streak.current / streak.target) * 100 : 0);
            return (
              <Card key={streak.title}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{streak.title}</CardTitle>
                      <CardDescription>{streak.description}</CardDescription>
                    </div>
                    <Badge variant={progress >= 100 ? "default" : "secondary"}>{progress.toFixed(0)}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{streak.current}</span>
                      <span className="text-sm text-muted-foreground">{streak.unit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Target: {streak.target} {streak.unit}</p>
                  </div>
                  <Progress value={progress} />
                  <Button asChild variant="outline" className="w-full">
                    <Link to={streak.href}>
                      {streak.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Habit Targets
            </CardTitle>
            <CardDescription>These targets are intentionally modest so users can build momentum first.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Daily</p>
              <p className="text-sm text-muted-foreground">Complete the brief and act on one item.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Weekly</p>
              <p className="text-sm text-muted-foreground">Review spending changes and pick next week's focus.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Monthly</p>
              <p className="text-sm text-muted-foreground">Close the month and snapshot net worth.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
