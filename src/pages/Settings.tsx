import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  getProfileById,
  updateProfile,
  updateProfilePreferenceSection,
} from "@/services/profile-service";
import {
  loadSubscriptionSnapshot,
  type SubscriptionSnapshot,
} from "@/services/subscription-service";
import { logAuditEvent } from "@/services/audit-service";
import type { Json } from "@/integrations/supabase/types";
import { featureGateConfig, getTierLabel, isFeatureAvailable, type PremiumTier } from "@/utils/feature-gates";
import { billingConfig, getCheckoutUrlForTier } from "@/config/billing";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  HelpCircle,
  Tag,
  Save,
  Camera,
  Lock,
  Globe,
  Calendar,
  DollarSign,
  Download,
  Trash2,
  AlertCircle,
  LogOut,
  Mail,
  FileText,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "@/utils/errors";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    return tab || "profile";
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);

  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: "John Doe",
    email: "john.doe@example.com",
    currency: "THB",
    timezone: "Asia/Bangkok",
    language: "en",
    theme: "light",
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1,234.56",
    firstDayOfWeek: "monday",
    budgetStartDay: "1",
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    email: {
      billReminders: true,
      budgetAlerts: true,
      goalProgress: true,
      insuranceRenewal: true,
      weeklySummary: false,
      monthlyReport: true,
    },
    inApp: {
      billReminders: true,
      budgetAlerts: true,
      goalProgress: true,
      insuranceRenewal: true,
      weeklySummary: true,
      monthlyReport: true,
    },
  });

  const fetchUserProfile = useCallback(async (userId: string) => {
    const data = await getProfileById(userId);
    let subscriptionSnapshot: SubscriptionSnapshot = {
      tier: "Free",
      selectedAt: null,
      updatedAt: null,
      unlockedFeatures: [],
    };

    try {
      subscriptionSnapshot = await loadSubscriptionSnapshot(userId);
    } catch (error) {
      console.warn("Could not load subscription snapshot:", error);
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (data) {
      setUserName(data.full_name || "User");
      setProfileData((prev) => ({
        ...prev,
        fullName: data.full_name || "User",
        email: user?.email || "user@example.com",
        currency: data.default_currency || "THB",
        timezone: data.timezone || "Asia/Bangkok",
      }));

      if (data.preferences) {
        const prefs = isRecord(data.preferences) ? data.preferences : {};
        if (prefs.app_preferences) setPreferences(prefs.app_preferences as typeof preferences);
        if (prefs.notifications) setNotifications(prefs.notifications as typeof notifications);
      }
    }

    setSubscription(subscriptionSnapshot);
  }, []);

  const handleSelectPlan = (tier: PremiumTier) => {
    if (tier === "Free") {
      handleManageBilling();
      return;
    }

    handleUpgradeClick(tier);
  };

  const handleRefreshSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const snapshot = await loadSubscriptionSnapshot(user.id);
      setSubscription(snapshot);
      toast({
        title: "Subscription refreshed",
        description: `Current plan: ${getTierLabel(snapshot.tier)}`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to refresh subscription status"),
        variant: "destructive",
      });
    }
  };

  const openExternal = (url: string | null) => {
    if (!url) return false;
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  };

  const handleUpgradeClick = (tier: Exclude<PremiumTier, "Free">) => {
    const checkoutUrl = getCheckoutUrlForTier(tier);
    if (openExternal(checkoutUrl)) return;

    toast({
      title: "Billing not connected yet",
      description: `Set VITE_CHECKOUT_URL_${tier.toUpperCase()} to wire this plan to checkout.`,
    });
  };

  const handleManageBilling = () => {
    if (openExternal(billingConfig.billingPortalUrl)) return;

    toast({
      title: "Billing portal not connected yet",
      description: "Set VITE_BILLING_PORTAL_URL to wire the customer portal.",
    });
  };

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
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, navigate]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await updateProfile(user.id, {
        full_name: profileData.fullName,
        default_currency: profileData.currency,
        timezone: profileData.timezone,
      });

      void logAuditEvent({
        user_id: user.id,
        event_type: "profile_updated",
        entity_type: "profiles",
        entity_id: user.id,
        metadata: {
          fields: ["full_name", "default_currency", "timezone"],
        },
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update profile"),
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      setIsChangePasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to change password"),
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await updateProfilePreferenceSection(
        user.id,
        "app_preferences",
        preferences as unknown as Json,
      );
      void logAuditEvent({
        user_id: user.id,
        event_type: "profile_preferences_saved",
        entity_type: "profiles",
        entity_id: user.id,
        metadata: {
          section: "app_preferences",
        },
      });

      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save preferences"),
        variant: "destructive",
      });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await updateProfilePreferenceSection(
        user.id,
        "notifications",
        notifications as unknown as Json,
      );
      void logAuditEvent({
        user_id: user.id,
        event_type: "profile_preferences_saved",
        entity_type: "profiles",
        entity_id: user.id,
        metadata: {
          section: "notifications",
        },
      });

      toast({
        title: "Success",
        description: "Notification settings saved successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save notifications"),
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    toast({
      title: "Export Started",
      description: "Your data export will download shortly",
    });
  };

  const activeSessions = [
    {
      id: "1",
      device: "Chrome on Windows",
      location: "Bangkok, Thailand",
      ipAddress: "123.45.67.89",
      lastActive: new Date(),
      current: true,
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "Bangkok, Thailand",
      ipAddress: "123.45.67.90",
      lastActive: new Date(Date.now() - 86400000),
      current: false,
    },
  ];

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Settings</h2>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full lg:w-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                      {profileData.fullName.charAt(0)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="font-medium">Profile Photo</p>
                    <p className="text-sm text-muted-foreground">Upload a new photo or remove current one</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">Upload Photo</Button>
                      <Button size="sm" variant="ghost" className="text-destructive">Remove</Button>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email is managed through authentication</p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Password</Label>
                    <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-fit">
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>Enter your current and new password</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsChangePasswordOpen(false);
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                            {isChangingPassword ? "Changing..." : "Change Password"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={profileData.currency}
                      onValueChange={(value) => setProfileData({ ...profileData, currency: value })}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">Thai Baht (฿)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profileData.timezone}
                      onValueChange={(value) => setProfileData({ ...profileData, timezone: value })}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Bangkok">Bangkok (GMT+7)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (GMT+11)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={profileData.language}
                      onValueChange={(value) => setProfileData({ ...profileData, language: value })}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="th">Thai (ไทย)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <Switch
                      checked={profileData.theme === "dark"}
                      onCheckedChange={(checked) =>
                        setProfileData({ ...profileData, theme: checked ? "dark" : "light" })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>Customize how data is displayed in the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="numberFormat">Number Format</Label>
                  <Select
                    value={preferences.numberFormat}
                    onValueChange={(value) => setPreferences({ ...preferences, numberFormat: value })}
                  >
                    <SelectTrigger id="numberFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1,234.56">1,234.56 (Comma separator)</SelectItem>
                      <SelectItem value="1.234,56">1.234,56 (Period separator)</SelectItem>
                      <SelectItem value="1 234.56">1 234.56 (Space separator)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="firstDayOfWeek">First Day of Week</Label>
                  <Select
                    value={preferences.firstDayOfWeek}
                    onValueChange={(value) => setPreferences({ ...preferences, firstDayOfWeek: value })}
                  >
                    <SelectTrigger id="firstDayOfWeek">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="budgetStartDay">Budget Start Day</Label>
                  <Select
                    value={preferences.budgetStartDay}
                    onValueChange={(value) => setPreferences({ ...preferences, budgetStartDay: value })}
                  >
                    <SelectTrigger id="budgetStartDay">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of the month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The day your monthly budget period starts
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleSavePreferences}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Access</CardTitle>
                <CardDescription>Review the current plan snapshot and the premium features it unlocks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Current plan</p>
                    <p className="mt-1 text-2xl font-bold">{getTierLabel(subscription?.tier || "Free")}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Selected at</p>
                    <p className="mt-1 text-lg font-semibold">
                      {subscription?.selectedAt ? format(new Date(subscription.selectedAt), "PPpp") : "Not selected yet"}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Unlocked features</p>
                    <p className="mt-1 text-2xl font-bold">{subscription?.unlockedFeatures.length || 0}</p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This page is the entitlement layer. Use checkout to upgrade and webhook sync to apply plan changes for upgrades, renewals, and cancellations.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" onClick={handleManageBilling}>
                    Manage billing
                  </Button>
                  <Button variant="outline" onClick={handleRefreshSubscription}>
                    Refresh subscription
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Checkout URLs are read from environment variables and opened in a new tab.
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {(["Free", "Plus", "Pro"] as const).map((tier) => {
                    const isActive = subscription?.tier === tier;
                    const tierFeatures = (Object.entries(featureGateConfig) as Array<[keyof typeof featureGateConfig, typeof featureGateConfig[keyof typeof featureGateConfig]]>)
                      .filter(([feature]) => isFeatureAvailable(tier, feature as keyof typeof featureGateConfig))
                      .map(([, config]) => config.label);

                    return (
                      <Card key={tier} className={isActive ? "border-primary shadow-sm" : ""}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{tier}</span>
                            {isActive ? <Badge>Active</Badge> : <Badge variant="outline">Available</Badge>}
                          </CardTitle>
                          <CardDescription>
                            {tier === "Free"
                              ? "Core tracking and public tools"
                              : tier === "Plus"
                                ? "Household / couple coordination"
                                : "AI coach and growth analytics"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {tierFeatures.length > 0 ? (
                              tierFeatures.map((feature) => (
                                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success">✓</span>
                                  <span>{feature}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">Core finance tracking and public calculators</p>
                            )}
                          </div>

                          <Button
                            className="w-full"
                            variant={isActive ? "default" : "outline"}
                            disabled={isActive}
                            onClick={() => {
                              if (isActive) return;
                              handleSelectPlan(tier);
                            }}
                          >
                            {isActive
                              ? "Current plan"
                              : tier === "Free"
                                ? "Switch to Free"
                                : `Upgrade to ${tier}`}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>Manage your income and expense categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Expense Categories</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">Housing</Badge>
                    <Badge variant="outline">Food & Dining</Badge>
                    <Badge variant="outline">Transportation</Badge>
                    <Badge variant="outline">Entertainment</Badge>
                    <Badge variant="outline">Utilities</Badge>
                    <Badge variant="outline">Shopping</Badge>
                    <Badge variant="outline">Healthcare</Badge>
                    <Badge variant="outline">Education</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/settings/categories")}>
                    <Tag className="h-4 w-4 mr-2" />
                    Manage Expense Categories
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Income Categories</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">Salary</Badge>
                    <Badge variant="outline">Freelance</Badge>
                    <Badge variant="outline">Investment</Badge>
                    <Badge variant="outline">Business</Badge>
                    <Badge variant="outline">Other</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/settings/categories")}>
                    <Tag className="h-4 w-4 mr-2" />
                    Manage Income Categories
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Categories are used to organize your transactions, budget, and reports. You can customize them to match your needs.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose which emails you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bill Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get notified before bills are due</p>
                  </div>
                  <Switch
                    checked={notifications.email.billReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, billReminders: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Budget Alerts</Label>
                    <p className="text-sm text-muted-foreground">Alerts when approaching budget limits</p>
                  </div>
                  <Switch
                    checked={notifications.email.budgetAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, budgetAlerts: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Goal Progress Updates</Label>
                    <p className="text-sm text-muted-foreground">Updates on your savings goals progress</p>
                  </div>
                  <Switch
                    checked={notifications.email.goalProgress}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, goalProgress: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Insurance Renewal Reminders</Label>
                    <p className="text-sm text-muted-foreground">Reminders for upcoming policy renewals</p>
                  </div>
                  <Switch
                    checked={notifications.email.insuranceRenewal}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, insuranceRenewal: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Summary</Label>
                    <p className="text-sm text-muted-foreground">Weekly overview of your finances</p>
                  </div>
                  <Switch
                    checked={notifications.email.weeklySummary}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, weeklySummary: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Monthly Report</Label>
                    <p className="text-sm text-muted-foreground">Comprehensive monthly financial report</p>
                  </div>
                  <Switch
                    checked={notifications.email.monthlyReport}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        email: { ...notifications.email, monthlyReport: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>In-App Notifications</CardTitle>
                <CardDescription>Notifications shown within the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Bill Reminders</Label>
                  <Switch
                    checked={notifications.inApp.billReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, billReminders: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Budget Alerts</Label>
                  <Switch
                    checked={notifications.inApp.budgetAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, budgetAlerts: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Goal Progress Updates</Label>
                  <Switch
                    checked={notifications.inApp.goalProgress}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, goalProgress: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Insurance Renewal Reminders</Label>
                  <Switch
                    checked={notifications.inApp.insuranceRenewal}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, insuranceRenewal: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Weekly Summary</Label>
                  <Switch
                    checked={notifications.inApp.weeklySummary}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, weeklySummary: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Monthly Report</Label>
                  <Switch
                    checked={notifications.inApp.monthlyReport}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        inApp: { ...notifications.inApp, monthlyReport: checked },
                      })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleSaveNotifications}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help & Support Tab */}
          <TabsContent value="help" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Help & Resources</CardTitle>
                <CardDescription>Find answers and get support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-start gap-3 text-left">
                    <FileText className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">User Guide</p>
                      <p className="text-sm text-muted-foreground">
                        Learn how to use all features of the application
                      </p>
                    </div>
                  </div>
                </Button>

                <Button variant="outline" className="w-full justify-start h-auto p-4">
                  <div className="flex items-start gap-3 text-left">
                    <HelpCircle className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">FAQ</p>
                      <p className="text-sm text-muted-foreground">
                        Frequently asked questions and answers
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Get help from our support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What do you need help with?" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue or question..."
                    rows={5}
                  />
                </div>

                <Button className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Or email us at{" "}
                  <a href="mailto:support@findashos.com" className="text-primary hover:underline">
                    support@findashos.com
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">January 2025</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">License</span>
                  <span className="font-medium">MIT</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
