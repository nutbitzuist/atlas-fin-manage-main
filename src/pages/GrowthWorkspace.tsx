import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Brain, CheckCircle, Crown, Download, Home, Mail, Shield, Sparkles, Trophy, UserPlus } from "lucide-react";
import SEO from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errors";
import {
  defaultGrowthState,
  loadGrowthState,
  saveLegacyGrowthState,
  trackCoachQuestion,
  trackHouseholdInvite,
  trackReferralInvite,
  trackTrustRequest,
  updateLifecycleEmailPreferences,
  upsertChallengeProgress,
  type GrowthState,
} from "@/services/growth-service";

const pages = {
  referrals: {
    title: "Referral Program",
    description: "Invite friends, attribute signups, and track reward progress after health score completion.",
    icon: UserPlus,
    highlights: ["Invite link", "Friend signup attribution", "Reward after health score completion", "Referral dashboard"],
  },
  challenges: {
    title: "Money Challenges",
    description: "Join habit challenges, track progress, complete milestones, and share momentum.",
    icon: Trophy,
    highlights: ["7-day expense awareness", "30-day category no-spend", "Emergency fund starter", "฿10,000 savings challenge", "Credit utilization challenge"],
  },
  household: {
    title: "Household / Couple Mode",
    description: "Coordinate shared budgets, goals, bills, and household reports while keeping personal accounts private.",
    icon: Home,
    highlights: ["Invite household member", "Shared budget", "Shared goals", "Private accounts", "Bill responsibilities"],
  },
  trust: {
    title: "Privacy & Trust Center",
    description: "Explain data use, export records, delete data, and clarify manual-first Thai bank positioning.",
    icon: Shield,
    highlights: ["Privacy policy", "Data export", "Delete account/data request", "Security explanation", "Manual-first Thai bank positioning"],
  },
  premium: {
    title: "Premium Packaging",
    description: "Clarify fair premium feature gates and upgrade paths.",
    icon: Crown,
    highlights: ["Advanced forecasts", "PDF exports", "Tax planning", "Household mode", "AI coach"],
  },
  "ai-coach": {
    title: "AI Finance Coach",
    description: "Ask guided questions about month summaries, spending leaks, budgets, debt, tax, and health scores.",
    icon: Brain,
    highlights: ["Summarize my month", "Find spending leaks", "Suggest budget cuts", "Explain my health score", "Generate tax checklist"],
  },
  "lifecycle-emails": {
    title: "Lifecycle Emails",
    description: "Preference-controlled lifecycle messaging for onboarding, reviews, reminders, tax season, and milestones.",
    icon: Mail,
    highlights: ["Onboarding", "Weekly review", "Monthly close", "Goal behind schedule", "Bill reminders", "Tax season"],
  },
  "growth-dashboard": {
    title: "Analytics & Growth Dashboard",
    description: "Track activation, retention, SEO conversion, referrals, adoption, and churn signals.",
    icon: BarChart3,
    highlights: ["Activation funnel", "DAU/MAU", "Retention cohorts", "SEO conversion", "Referral conversion", "Feature adoption"],
  },
} as const;

type PageKey = keyof typeof pages;

const challengeDefaults = [
  { name: "7-day expense awareness", progress: 4, total: 7 },
  { name: "30-day category no-spend", progress: 9, total: 30 },
  { name: "Emergency fund starter", progress: 2, total: 4 },
  { name: "฿10,000 savings challenge", progress: 6500, total: 10000 },
  { name: "Credit utilization challenge", progress: 22, total: 30 },
];

export default function GrowthWorkspace() {
  const { toast } = useToast();
  const location = useLocation();
  const page = location.pathname.replace("/", "") || "referrals";
  const config = pages[(page as PageKey)] || pages.referrals;
  const Icon = config.icon;
  const [inviteEmail, setInviteEmail] = useState("");
  const [householdEmail, setHouseholdEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [growthState, setGrowthState] = useState<GrowthState>(() => defaultGrowthState());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      try {
        setGrowthState(await loadGrowthState(user.id, challengeDefaults));
      } catch (error) {
        toast({
          title: "Could not load growth workspace",
          description: getErrorMessage(error, "Using local defaults until the growth tables are available."),
          variant: "destructive",
        });
      }
    };

    loadState();
  }, [toast]);

  const inviteLink = useMemo(() => `${window.location.origin}/login?ref=${growthState.referralCode}`, [growthState.referralCode]);

  const saveGrowthState = async (
    nextState: GrowthState,
    successMessage?: string,
    syncAction?: () => Promise<void>
  ) => {
    setGrowthState(nextState);
    if (!userId) return;

    setSaving(true);
    try {
      if (syncAction) await syncAction();
      await saveLegacyGrowthState(userId, nextState);
      if (successMessage) {
        toast({ title: successMessage });
      }
    } catch (error: unknown) {
      toast({
        title: "Could not save growth settings",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportTrustData = () => {
    const blob = new Blob([JSON.stringify({
      exportedAt: new Date().toISOString(),
      scope: "Atlas profile growth, referral, challenge, lifecycle, and trust preferences",
      growth: growthState,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atlas-data-export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const coachAnswers = [
    "Month summary: review income, expenses, savings rate, bills, debt payments, and top category changes.",
    "Spending leaks: compare the last 90 days by category and start with recurring bills or high-frequency small purchases.",
    "Debt plan: use avalanche for interest savings or snowball for faster motivation wins.",
    "Tax checklist: confirm RMF/SSF/Thai ESG, insurance certificates, donations, and mortgage interest before year-end.",
  ];

  const sendReferralInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    const nextState = {
      ...growthState,
      invitedEmails: Array.from(new Set([...growthState.invitedEmails, email])),
    };
    setInviteEmail("");
    saveGrowthState(
      nextState,
      "Referral invite tracked",
      () => trackReferralInvite(userId!, nextState.referralCode, email)
    );
  };

  const toggleChallenge = (name: string, defaultProgress: number) => {
    const definition = challengeDefaults.find((challenge) => challenge.name === name);
    if (!definition) return;
    const existing = growthState.challenges[name] || { joined: false, progress: defaultProgress };
    const nextChallenge = { ...existing, joined: !existing.joined };
    const nextState = {
      ...growthState,
      challenges: {
        ...growthState.challenges,
        [name]: nextChallenge,
      },
    };
    saveGrowthState(
      nextState,
      existing.joined ? "Challenge paused" : "Challenge joined",
      () => upsertChallengeProgress(userId!, definition, nextChallenge.joined, nextChallenge.progress)
    );
  };

  const advanceChallenge = (name: string, total: number, defaultProgress: number) => {
    const definition = challengeDefaults.find((challenge) => challenge.name === name);
    if (!definition) return;
    const existing = growthState.challenges[name] || { joined: true, progress: defaultProgress };
    const nextChallenge = { joined: true, progress: Math.min(total, existing.progress + (total >= 1000 ? 500 : 1)) };
    const step = total >= 1000 ? 500 : 1;
    const nextState = {
      ...growthState,
      challenges: {
        ...growthState.challenges,
        [name]: nextChallenge,
      },
    };
    saveGrowthState(
      nextState,
      "Challenge progress updated",
      () => upsertChallengeProgress(userId!, definition, nextChallenge.joined, nextChallenge.progress)
    );
  };

  const sendHouseholdInvite = () => {
    const email = householdEmail.trim().toLowerCase();
    if (!email) return;
    const nextState = {
      ...growthState,
      householdInvites: Array.from(new Set([...growthState.householdInvites, email])),
    };
    setHouseholdEmail("");
    saveGrowthState(
      nextState,
      "Household invite tracked",
      () => trackHouseholdInvite(userId!, email)
    );
  };

  const updateEmailPreference = (key: string, enabled: boolean) => {
    const nextState = {
      ...growthState,
      emailPrefs: { ...growthState.emailPrefs, [key]: enabled },
    };
    saveGrowthState(
      nextState,
      undefined,
      () => updateLifecycleEmailPreferences(userId!, nextState.emailPrefs)
    );
  };

  const requestDeletion = () => {
    const requestedAt = new Date().toISOString();
    saveGrowthState({
      ...growthState,
      deletionRequestedAt: requestedAt,
    }, "Deletion request recorded", () => trackTrustRequest(userId!, "delete_data"));
  };

  const askCoachQuestion = () => {
    saveGrowthState({
      ...growthState,
      coachQuestionsAsked: growthState.coachQuestionsAsked + 1,
    }, "Coach question tracked", () => trackCoachQuestion(userId!));
  };

  const joinedChallenges = Object.values(growthState.challenges).filter((challenge) => challenge.joined).length;
  const completedChallenges = challengeDefaults.filter((challenge) => {
    const saved = growthState.challenges[challenge.name];
    return saved && saved.progress >= challenge.total;
  }).length;

  return (
    <Layout userName="User">
      <SEO title={config.title} description={config.description} noindex />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">Virality & Scale</Badge>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              <Icon className="h-7 w-7 text-primary" />
              {config.title}
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">{config.description}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/growth-dashboard">Growth dashboard</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {config.highlights.slice(0, 4).map((item) => (
            <Card key={item}>
              <CardContent className="pt-6">
                <CheckCircle className="mb-3 h-5 w-5 text-success" />
                <p className="text-sm font-medium">{item}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {page === "referrals" && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Invite Link</CardTitle>
              <CardDescription>Use this link for measurable friend signup attribution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input value={inviteLink} readOnly />
              <div className="flex gap-2">
                <Input placeholder="friend@email.com" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
                <Button onClick={sendReferralInvite} disabled={saving || !inviteEmail.trim()}>Invite</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  `Invites sent: ${growthState.invitedEmails.length}`,
                  `Friend signups: ${growthState.friendSignups}`,
                  `Rewards earned: ${growthState.rewardsEarned}`,
                ].map((item) => <div key={item} className="rounded-lg border p-4 text-sm font-medium">{item}</div>)}
              </div>
            </CardContent>
          </Card>
        )}

        {page === "challenges" && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {challengeDefaults.map((challenge) => (
              <Card key={challenge.name}>
                <CardHeader>
                  <CardTitle>{challenge.name}</CardTitle>
                  <CardDescription>Join, track, complete, and share progress.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const saved = growthState.challenges[challenge.name] || { joined: false, progress: challenge.progress };
                    return (
                      <>
                        <Progress value={(saved.progress / challenge.total) * 100} />
                        <p className="text-sm text-muted-foreground">{saved.progress.toLocaleString()} / {challenge.total.toLocaleString()}</p>
                        <div className="flex gap-2">
                          <Button variant={saved.joined ? "default" : "outline"} onClick={() => toggleChallenge(challenge.name, challenge.progress)}>
                            {saved.joined ? "Joined" : "Join challenge"}
                          </Button>
                          <Button variant="outline" disabled={!saved.joined || saved.progress >= challenge.total} onClick={() => advanceChallenge(challenge.name, challenge.total, challenge.progress)}>
                            Update progress
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {page === "household" && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Invite Household Member</CardTitle>
              <CardDescription>Create a shared workspace while keeping personal accounts private.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="partner@email.com" value={householdEmail} onChange={(event) => setHouseholdEmail(event.target.value)} />
                <Button onClick={sendHouseholdInvite} disabled={saving || !householdEmail.trim()}>Invite</Button>
              </div>
              <p className="text-sm text-muted-foreground">{growthState.householdInvites.length} household invite{growthState.householdInvites.length === 1 ? "" : "s"} tracked.</p>
              <div className="grid gap-4 md:grid-cols-3">
              {["Shared budget", "Shared goals", "Bill responsibilities", "Monthly household report", "Private personal accounts"].map((item) => (
                <div key={item} className="rounded-lg border p-4 text-sm font-medium">{item}</div>
              ))}
              </div>
            </CardContent>
          </Card>
        )}

        {page === "trust" && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Data Controls</CardTitle>
              <CardDescription>Manual-first, Thai-bank-compatible positioning with clear user data controls.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Button onClick={exportTrustData}><Download className="mr-2 h-4 w-4" />Export data</Button>
              <Button variant="outline" onClick={requestDeletion}>
                {growthState.deletionRequestedAt ? "Deletion requested" : "Request deletion"}
              </Button>
              <Button variant="outline" asChild><Link to="/settings">Read privacy policy</Link></Button>
            </CardContent>
          </Card>
        )}

        {page === "premium" && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Premium feature gates</CardTitle>
                <CardDescription>
                  Current plan: <strong>{growthState.premiumTier}</strong>. Plus and Pro entitlements are managed in billing settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upgrade actions are controlled by the checkout flow and webhook sync so plan changes are reflected consistently across your workspace.
                </p>
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/settings?tab=billing">Open billing settings</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {page === "ai-coach" && (
          <Card className="mt-8">
            <CardHeader><CardTitle>Guided Coach Prompts</CardTitle><CardDescription>Responses cite the type of user data they would use.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {coachAnswers.map((answer) => <div key={answer} className="rounded-lg border p-4 text-sm text-muted-foreground">{answer}</div>)}
              <Button onClick={askCoachQuestion}>Track coach question</Button>
              <p className="text-sm text-muted-foreground">{growthState.coachQuestionsAsked} coach question{growthState.coachQuestionsAsked === 1 ? "" : "s"} tracked.</p>
            </CardContent>
          </Card>
        )}

        {page === "lifecycle-emails" && (
          <Card className="mt-8">
            <CardHeader><CardTitle>Email Preferences</CardTitle><CardDescription>Preference-controlled lifecycle flows.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(growthState.emailPrefs).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                  <span className="capitalize">{key.replace("-", " ")}</span>
                  <Switch checked={enabled} onCheckedChange={(checked) => updateEmailPreference(key, checked)} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {page === "growth-dashboard" && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Activation funnel", `${growthState.invitedEmails.length + joinedChallenges + growthState.coachQuestionsAsked}`],
              ["DAU / MAU", "Profile event ready"],
              ["Retention cohorts", `${joinedChallenges} active challenges`],
              ["SEO conversion", "Sitemap ready"],
              ["Referral conversion", `${growthState.friendSignups}/${growthState.invitedEmails.length}`],
              ["Feature adoption", `${completedChallenges} challenges completed`],
              ["Churn signals", growthState.deletionRequestedAt ? "Deletion requested" : "No request"],
            ].map(([metric, value]) => (
              <Card key={metric}>
                <CardHeader><CardTitle className="text-base">{metric}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">Ready for analytics events</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Next Integration Hooks</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {config.highlights.map((item) => <div key={item} className="rounded-lg border p-3 text-sm text-muted-foreground">{item}</div>)}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
