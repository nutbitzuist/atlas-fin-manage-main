import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Shield,
  DollarSign,
  Calendar,
  Heart,
  Car,
  Home,
  Plane,
  Activity,
  FileText,
  AlertCircle,
  CheckCircle,
  Pencil,
  Trash2
} from "lucide-react";
import { format, differenceInDays, addYears } from "date-fns";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { getErrorMessage } from "@/utils/errors";
import { getProfileDisplayName } from "@/services/profile-service";
import { createTransaction } from "@/services/transaction-service";
import {
  createInsurancePolicy,
  deleteInsurancePolicy,
  getInsurancePoliciesByUser,
  updateInsurancePolicy,
} from "@/services/insurance-service";

interface InsurancePolicy {
  id: string;
  user_id: string;
  policy_name: string;
  policy_type: string;
  provider: string;
  policy_number: string;
  premium_amount: number;
  premium_frequency: string | null;
  currency: string;
  coverage_amount: number;
  start_date: string;
  end_date: string | null;
  renewal_date: string | null;
  beneficiaries: string | null;
  notes: string | null;
  status?: string;
  payment_status?: string;
  last_paid_date?: string | null;
  next_payment_date?: string | null;
  tax_deductible?: boolean;
  tax_deduction_category?: string | null;
  created_at?: string;
  updated_at?: string;
}

const Insurance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "life" | "health" | "vehicle" | "property" | "other">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    policy_type: "",
    provider: "",
    policy_number: "",
    coverage_amount: "",
    premium_amount: "",
    premium_frequency: "",
    start_date: "",
    renewal_date: "",
    beneficiaries: "",
    notes: "",
    tax_deductible: true,
    tax_deduction_category: ""
  });

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
        fetchPolicies(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

    const fetchUserProfile = async (userId: string) => {
    const profileName = await getProfileDisplayName(userId);
    setUserName(profileName);
  };

  const fetchPolicies = async (userId: string) => {
    try {
      setPoliciesLoading(true);
      const policies = await getInsurancePoliciesByUser(userId, {
        orderBy: "renewal_date",
        ascending: true,
      });
      setPolicies(policies || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to fetch insurance policies"),
        variant: "destructive"
      });
    } finally {
      setPoliciesLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      policy_type: "",
      provider: "",
      policy_number: "",
      coverage_amount: "",
      premium_amount: "",
      premium_frequency: "",
      start_date: "",
      renewal_date: "",
      beneficiaries: "",
      notes: "",
      tax_deductible: true,
      tax_deduction_category: ""
    });
  };

  const handleAddPolicy = async () => {
    if (!session?.user.id) return;

    if (!formData.policy_type || !formData.provider || !formData.policy_number ||
      !formData.coverage_amount || !formData.premium_amount ||
      !formData.start_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await createInsurancePolicy({
        user_id: session.user.id,
        policy_name: formData.provider,
        policy_type: formData.policy_type,
        provider: formData.provider,
        policy_number: formData.policy_number,
        premium_amount: parseFloat(formData.premium_amount),
        premium_frequency: formData.premium_frequency || null,
        currency: "THB",
        coverage_amount: parseFloat(formData.coverage_amount),
        start_date: formData.start_date,
        end_date: null,
        renewal_date: formData.renewal_date || null,
        beneficiaries: formData.beneficiaries || null,
        notes: formData.notes || null,
        tax_deductible: formData.tax_deductible,
        tax_deduction_category: formData.tax_deduction_category || null,
      });

      toast({
        title: "Success",
        description: "Insurance policy added successfully"
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchPolicies(session.user.id);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to add insurance policy"),
        variant: "destructive"
      });
    }
  };

  const handleEditPolicy = async () => {
    if (!session?.user.id || !editingPolicy) return;

    if (!formData.policy_type || !formData.provider || !formData.policy_number ||
      !formData.coverage_amount || !formData.premium_amount ||
      !formData.start_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateInsurancePolicy(editingPolicy.id, session.user.id, {
        policy_name: formData.provider,
        policy_type: formData.policy_type,
        provider: formData.provider,
        policy_number: formData.policy_number,
        premium_amount: parseFloat(formData.premium_amount),
        premium_frequency: formData.premium_frequency || null,
        coverage_amount: parseFloat(formData.coverage_amount),
        start_date: formData.start_date,
        renewal_date: formData.renewal_date || null,
        beneficiaries: formData.beneficiaries || null,
        notes: formData.notes || null,
        tax_deductible: formData.tax_deductible,
        tax_deduction_category: formData.tax_deduction_category || null,
      });

      toast({
        title: "Success",
        description: "Insurance policy updated successfully"
      });

      setIsEditDialogOpen(false);
      setEditingPolicy(null);
      resetForm();
      fetchPolicies(session.user.id);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update insurance policy"),
        variant: "destructive"
      });
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!session?.user.id) return;

    if (!confirm("Are you sure you want to delete this insurance policy?")) {
      return;
    }

    try {
      await deleteInsurancePolicy(policyId, session.user.id);

      toast({
        title: "Success",
        description: "Insurance policy deleted successfully"
      });

      fetchPolicies(session.user.id);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete insurance policy"),
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (policy: InsurancePolicy) => {
    setEditingPolicy(policy);
    setFormData({
      policy_type: policy.policy_type,
      provider: policy.provider,
      policy_number: policy.policy_number,
      coverage_amount: policy.coverage_amount.toString(),
      premium_amount: policy.premium_amount.toString(),
      premium_frequency: policy.premium_frequency,
      start_date: policy.start_date,
      renewal_date: policy.renewal_date || "",
      beneficiaries: policy.beneficiaries || "",
      notes: policy.notes || "",
      tax_deductible: policy.tax_deductible ?? true,
      tax_deduction_category: policy.tax_deduction_category || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleTogglePaymentStatus = async (policy: InsurancePolicy) => {
    if (!session?.user.id) return;

    const newStatus = policy.payment_status === 'paid' ? 'pending' : 'paid';
    const updateData: TablesUpdate<"insurance_policies"> = {
      payment_status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'paid') {
      updateData.last_paid_date = new Date().toISOString().split('T')[0];
      // Calculate next payment date based on frequency
      const now = new Date();
      if (policy.premium_frequency === 'monthly') {
        now.setMonth(now.getMonth() + 1);
      } else if (policy.premium_frequency === 'quarterly') {
        now.setMonth(now.getMonth() + 3);
      } else {
        now.setFullYear(now.getFullYear() + 1);
      }
      updateData.next_payment_date = now.toISOString().split('T')[0];
    }

    try {
      await updateInsurancePolicy(policy.id, session.user.id, updateData);

      // Log transaction as an expense
      if (newStatus === 'paid') {
        let expenseLogged = false;
        try {
          await createTransaction({
            user_id: session.user.id,
            amount: policy.premium_amount,
            type: "expense",
            category: "Insurance",
            transaction_date: updateData.last_paid_date || new Date().toISOString().split("T")[0],
            description: `Insurance Premium Paid: ${policy.provider} (${policy.policy_number || "N/A"})`,
            currency: "THB",
            account_id: null,
          });
          expenseLogged = true;
        } catch (txError) {
          console.warn("Failed to log transaction for insurance payment:", txError);
          // Inform the user but don't fail the whole operation
          toast({
            title: "Warning",
            description: "Policy marked as paid, but tracking as an expense failed.",
            variant: "destructive"
          });
        }
        if (expenseLogged) {
          toast({
            title: "Payment Logged",
            description: `${policy.provider} marked as ${newStatus} and expense recorded.`
          });
        }
      } else {
        toast({
          title: "Payment Status Updated",
          description: `${policy.provider} marked as ${newStatus}`
        });
      }


      fetchPolicies(session.user.id);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update payment status"),
        variant: "destructive"
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

  const normalizeType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'life': 'Life',
      'health': 'Health',
      'critical': 'Critical Illness',
      'accident': 'Accident',
      'vehicle': 'Vehicle',
      'property': 'Property',
      'travel': 'Travel',
      'other': 'Other'
    };
    return typeMap[type.toLowerCase()] || type;
  };

  const filteredPolicies = policies.filter((policy) => {
    if (filterType === "all") return true;
    const normalizedType = normalizeType(policy.policy_type);
    if (filterType === "life") return normalizedType === "Life";
    if (filterType === "health") return normalizedType === "Health" || normalizedType === "Critical Illness" || normalizedType === "Accident";
    if (filterType === "vehicle") return normalizedType === "Vehicle";
    if (filterType === "property") return normalizedType === "Property";
    if (filterType === "other") return normalizedType === "Travel" || normalizedType === "Other";
    return true;
  });

  const totalCoverage = policies.reduce((sum, policy) => sum + policy.coverage_amount, 0);
  const formatTHB = (value: number) => `฿${Math.max(0, Math.round(value)).toLocaleString()}`;

  const getAnnualPremium = (policy: InsurancePolicy) => {
    if (!policy.premium_frequency) return policy.premium_amount;
    const frequency = policy.premium_frequency.toLowerCase();
    if (frequency === "monthly") return policy.premium_amount * 12;
    if (frequency === "quarterly") return policy.premium_amount * 4;
    return policy.premium_amount;
  };

  const totalAnnualPremiums = policies.reduce((sum, policy) => sum + getAnnualPremium(policy), 0);
  const activePoliciesCount = policies.length;

  // Coverage by category
  const coverageByCategory = {
    Life: policies.filter(p => normalizeType(p.policy_type) === "Life").reduce((sum, p) => sum + p.coverage_amount, 0),
    Health: policies.filter(p => {
      const type = normalizeType(p.policy_type);
      return type === "Health" || type === "Critical Illness" || type === "Accident";
    }).reduce((sum, p) => sum + p.coverage_amount, 0),
    Vehicle: policies.filter(p => normalizeType(p.policy_type) === "Vehicle").reduce((sum, p) => sum + p.coverage_amount, 0),
    Property: policies.filter(p => normalizeType(p.policy_type) === "Property").reduce((sum, p) => sum + p.coverage_amount, 0),
    Other: policies.filter(p => {
      const type = normalizeType(p.policy_type);
      return type === "Travel" || type === "Other";
    }).reduce((sum, p) => sum + p.coverage_amount, 0),
  };

  // Thai Tax Deduction Calculations
  const lifeInsurancePremiums = policies
    .filter((p) => normalizeType(p.policy_type) === "Life")
    .reduce((sum, p) => sum + getAnnualPremium(p), 0);
  const healthInsurancePremiums = policies
    .filter((p) => {
      const type = normalizeType(p.policy_type);
      return type === "Health" || type === "Critical Illness";
    })
    .reduce((sum, p) => sum + getAnnualPremium(p), 0);

  // Individual limits
  const maxLifeDeduction = 100000;
  const maxHealthDeduction = 25000;
  const maxCombinedDeduction = 100000; // Combined cap for life + health

  // Calculate individual deductions (capped)
  const lifeDeduction = Math.min(lifeInsurancePremiums, maxLifeDeduction);
  const healthDeduction = Math.min(healthInsurancePremiums, maxHealthDeduction);

  // Apply combined cap: life + health cannot exceed 100,000
  const rawCombinedDeduction = lifeDeduction + healthDeduction;
  const actualCombinedDeduction = Math.min(rawCombinedDeduction, maxCombinedDeduction);

  // Calculate remaining capacity (considering combined cap)
  const lifeDeductionRemaining = Math.max(0, maxLifeDeduction - lifeInsurancePremiums);
  const healthDeductionRemaining = Math.max(0, maxHealthDeduction - healthInsurancePremiums);
  const combinedDeductionRemaining = Math.max(0, maxCombinedDeduction - actualCombinedDeduction);

  const upcomingRenewals = policies
    .filter(policy => policy.renewal_date)
    .map(policy => ({
      policy,
      daysUntil: differenceInDays(new Date(policy.renewal_date!), new Date()),
    }))
    .filter(item => item.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const beneficiaryIncomplete = policies.filter(policy => {
    const type = normalizeType(policy.policy_type);
    return ["Life", "Critical Illness", "Accident"].includes(type) && !policy.beneficiaries;
  });

  const coverageTargets = [
    { type: "Life", label: "Life", current: coverageByCategory.Life, target: 3000000, icon: Heart },
    { type: "Health", label: "Health / Critical", current: coverageByCategory.Health, target: 1000000, icon: Activity },
    { type: "Vehicle", label: "Vehicle", current: coverageByCategory.Vehicle, target: policies.some(p => normalizeType(p.policy_type) === "Vehicle") ? 500000 : 0, icon: Car },
    { type: "Property", label: "Property", current: coverageByCategory.Property, target: policies.some(p => normalizeType(p.policy_type) === "Property") ? 1000000 : 0, icon: Home },
  ].map(item => ({
    ...item,
    gap: Math.max(0, item.target - item.current),
    progress: item.target > 0 ? Math.min(100, (item.current / item.target) * 100) : 100,
  }));

  const missingCoreCoverage = coverageTargets
    .filter(item => ["Life", "Health"].includes(item.type) && item.current <= 0)
    .map(item => item.label);

  const coverageGapTotal = coverageTargets.reduce((sum, item) => sum + item.gap, 0);
  const renewalRiskCount = upcomingRenewals.filter(item => item.daysUntil <= 30).length;
  const insuranceActionPlan = [
    coverageGapTotal > 0
      ? `Close estimated coverage gaps totaling ${formatTHB(coverageGapTotal)}, starting with life and health protection.`
      : "Coverage targets are met based on the default protection assumptions.",
    beneficiaryIncomplete.length > 0
      ? `Add beneficiaries to ${beneficiaryIncomplete.length} life, critical illness, or accident policy record(s).`
      : "Beneficiary details are complete for protection policies.",
    renewalRiskCount > 0
      ? `Review ${renewalRiskCount} policy renewal(s) due within 30 days.`
      : "No urgent renewals within 30 days.",
    combinedDeductionRemaining > 0
      ? `Insurance tax deduction room remains ${formatTHB(combinedDeductionRemaining)} under the combined Thai cap.`
      : "Insurance deduction room is fully used under the combined Thai cap.",
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Life":
      case "Critical Illness":
      case "Accident":
        return Heart;
      case "Health":
        return Activity;
      case "Vehicle":
        return Car;
      case "Property":
        return Home;
      case "Travel":
        return Plane;
      default:
        return Shield;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Life":
        return "default";
      case "Health":
        return "default";
      case "Vehicle":
        return "secondary";
      case "Property":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRenewalUrgency = (renewalDate: Date): { color: BadgeProps["variant"]; label: string } => {
    const daysUntil = differenceInDays(renewalDate, new Date());
    if (daysUntil <= 30) return { color: "destructive", label: "Urgent" };
    if (daysUntil <= 60) return { color: "secondary", label: "Soon" };
    if (daysUntil <= 90) return { color: "secondary", label: "Upcoming" };
    return { color: "default", label: "On Track" };
  };

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Insurance</h2>
            <p className="text-muted-foreground">Manage your insurance policies and coverage</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Insurance Policy</DialogTitle>
                <DialogDescription>Enter the details of your insurance policy</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="policyType">Policy Type *</Label>
                    <Select value={formData.policy_type} onValueChange={(value) => setFormData({ ...formData, policy_type: value })}>
                      <SelectTrigger id="policyType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="life">Life Insurance</SelectItem>
                        <SelectItem value="health">Health Insurance</SelectItem>
                        <SelectItem value="critical">Critical Illness</SelectItem>
                        <SelectItem value="accident">Accident Insurance</SelectItem>
                        <SelectItem value="vehicle">Vehicle Insurance</SelectItem>
                        <SelectItem value="property">Property Insurance</SelectItem>
                        <SelectItem value="travel">Travel Insurance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Insurance Company *</Label>
                    <Input
                      id="company"
                      placeholder="e.g., AIA Thailand"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number *</Label>
                  <Input
                    id="policyNumber"
                    placeholder="e.g., AIA-2024-001234"
                    value={formData.policy_number}
                    onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coverage">Coverage Amount *</Label>
                    <Input
                      id="coverage"
                      type="number"
                      placeholder="0.00"
                      value={formData.coverage_amount}
                      onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premium">Premium Amount *</Label>
                    <Input
                      id="premium"
                      type="number"
                      placeholder="0.00"
                      value={formData.premium_amount}
                      onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Premium Frequency</Label>
                    <Select value={formData.premium_frequency} onValueChange={(value) => setFormData({ ...formData, premium_frequency: value })}>
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="renewalDate">Renewal Date</Label>
                    <Input
                      id="renewalDate"
                      type="date"
                      value={formData.renewal_date}
                      onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="taxDeductible"
                      checked={formData.tax_deductible}
                      onChange={(e) => setFormData({ ...formData, tax_deductible: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="taxDeductible">Is Tax Deductible (Thai Tax)</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxCategory">Deduction Category</Label>
                    <Select
                      value={formData.tax_deduction_category}
                      onValueChange={(value) => setFormData({ ...formData, tax_deduction_category: value })}
                      disabled={!formData.tax_deductible}
                    >
                      <SelectTrigger id="taxCategory">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="life_insurance">Life Insurance (Capped at 100k)</SelectItem>
                        <SelectItem value="health_insurance">Health Insurance (Capped at 25k)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beneficiaries">Beneficiaries</Label>
                  <Textarea
                    id="beneficiaries"
                    placeholder="List beneficiaries..."
                    value={formData.beneficiaries}
                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddPolicy}>Save Policy</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Insurance Policy</DialogTitle>
              <DialogDescription>Update the details of your insurance policy</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPolicyType">Policy Type *</Label>
                  <Select value={formData.policy_type} onValueChange={(value) => setFormData({ ...formData, policy_type: value })}>
                    <SelectTrigger id="editPolicyType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="life">Life Insurance</SelectItem>
                      <SelectItem value="health">Health Insurance</SelectItem>
                      <SelectItem value="critical">Critical Illness</SelectItem>
                      <SelectItem value="accident">Accident Insurance</SelectItem>
                      <SelectItem value="vehicle">Vehicle Insurance</SelectItem>
                      <SelectItem value="property">Property Insurance</SelectItem>
                      <SelectItem value="travel">Travel Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCompany">Insurance Company *</Label>
                  <Input
                    id="editCompany"
                    placeholder="e.g., AIA Thailand"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPolicyNumber">Policy Number *</Label>
                <Input
                  id="editPolicyNumber"
                  placeholder="e.g., AIA-2024-001234"
                  value={formData.policy_number}
                  onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCoverage">Coverage Amount *</Label>
                  <Input
                    id="editCoverage"
                    type="number"
                    placeholder="0.00"
                    value={formData.coverage_amount}
                    onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPremium">Premium Amount *</Label>
                  <Input
                    id="editPremium"
                    type="number"
                    placeholder="0.00"
                    value={formData.premium_amount}
                    onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFrequency">Premium Frequency</Label>
                  <Select value={formData.premium_frequency} onValueChange={(value) => setFormData({ ...formData, premium_frequency: value })}>
                    <SelectTrigger id="editFrequency">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Start Date *</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRenewalDate">Renewal Date</Label>
                  <Input
                    id="editRenewalDate"
                    type="date"
                    value={formData.renewal_date}
                    onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editTaxDeductible"
                    checked={formData.tax_deductible}
                    onChange={(e) => setFormData({ ...formData, tax_deductible: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="editTaxDeductible">Is Tax Deductible (Thai Tax)</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTaxCategory">Deduction Category</Label>
                  <Select
                    value={formData.tax_deduction_category}
                    onValueChange={(value) => setFormData({ ...formData, tax_deduction_category: value })}
                    disabled={!formData.tax_deductible}
                  >
                    <SelectTrigger id="editTaxCategory">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="life_insurance">Life Insurance (Capped at 100k)</SelectItem>
                      <SelectItem value="health_insurance">Health Insurance (Capped at 25k)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editBeneficiaries">Beneficiaries</Label>
                <Textarea
                  id="editBeneficiaries"
                  placeholder="List beneficiaries..."
                  value={formData.beneficiaries}
                  onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  placeholder="Additional information..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingPolicy(null); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleEditPolicy}>Update Policy</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Coverage Amount</p>
                  <p className="text-2xl font-bold">฿{(totalCoverage / 1000000).toFixed(1)}M</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Annual Premiums</p>
                  <p className="text-2xl font-bold">฿{totalAnnualPremiums.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Policies</p>
                  <p className="text-2xl font-bold">{activePoliciesCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insurance Coverage Check */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Insurance Coverage Check
            </CardTitle>
            <CardDescription>
              Find protection gaps, urgent renewals, beneficiary issues, and tax-deductible premium room.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Coverage Gap</p>
                <p className={`mt-1 text-2xl font-bold ${coverageGapTotal > 0 ? "text-warning" : "text-success"}`}>
                  {formatTHB(coverageGapTotal)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Against default protection targets</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Missing Core Coverage</p>
                <p className="mt-1 text-2xl font-bold">{missingCoreCoverage.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {missingCoreCoverage.length > 0 ? missingCoreCoverage.join(", ") : "Life and health are present"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Renewals in 90 Days</p>
                <p className={`mt-1 text-2xl font-bold ${renewalRiskCount > 0 ? "text-destructive" : ""}`}>
                  {upcomingRenewals.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{renewalRiskCount} urgent within 30 days</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Beneficiary Gaps</p>
                <p className={`mt-1 text-2xl font-bold ${beneficiaryIncomplete.length > 0 ? "text-warning" : "text-success"}`}>
                  {beneficiaryIncomplete.length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Life, critical, and accident policies</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold">Coverage Gap Analysis</h3>
                {coverageTargets.map((target) => {
                  const Icon = target.icon;

                  return (
                    <div key={target.type} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{target.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Target {formatTHB(target.target)} • Current {formatTHB(target.current)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={target.gap > 0 ? "outline" : "default"}>
                          {target.gap > 0 ? `${formatTHB(target.gap)} gap` : "Covered"}
                        </Badge>
                      </div>
                      <Progress value={target.progress} className="h-2" />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Recommended Actions</h3>
                {insuranceActionPlan.map((action, index) => (
                  <div key={action} className="flex gap-3 rounded-lg border p-4">
                    {action.includes("complete") || action.includes("No urgent") || action.includes("fully used") || action.includes("met") ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Action {index + 1}</p>
                      <p className="text-sm text-muted-foreground">{action}</p>
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Assumptions</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Uses default starter targets of ฿3M life, ฿1M health/critical, and existing vehicle/property policy checks.
                    Coverage needs should be adjusted for dependents, debt, assets, employer benefits, and medical preferences.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status Summary */}
        {policies.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="border-emerald-200 dark:border-emerald-800/40">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Paid This Year</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {policies.filter(p => p.payment_status === 'paid').length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ฿{policies.filter(p => p.payment_status === 'paid').reduce((sum, p) => {
                        if (!p.premium_frequency) return sum + p.premium_amount;
                        return sum + (p.premium_frequency.toLowerCase() === "yearly" ? p.premium_amount : p.premium_amount * 12);
                      }, 0).toLocaleString()} paid
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800/40">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Pending</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {policies.filter(p => p.payment_status !== 'paid').length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ฿{policies.filter(p => p.payment_status !== 'paid').reduce((sum, p) => {
                        if (!p.premium_frequency) return sum + p.premium_amount;
                        return sum + (p.premium_frequency.toLowerCase() === "yearly" ? p.premium_amount : p.premium_amount * 12);
                      }, 0).toLocaleString()} remaining
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Payment Due</p>
                    {(() => {
                      const upcoming = policies
                        .filter(p => p.next_payment_date || p.renewal_date)
                        .sort((a, b) => {
                          const dateA = a.next_payment_date || a.renewal_date || '';
                          const dateB = b.next_payment_date || b.renewal_date || '';
                          return dateA.localeCompare(dateB);
                        });
                      const next = upcoming.find(p => {
                        const d = p.next_payment_date || p.renewal_date;
                        return d && new Date(d) >= new Date();
                      });
                      return next ? (
                        <>
                          <p className="text-lg font-bold">{format(new Date(next.next_payment_date || next.renewal_date!), "MMM dd")}</p>
                          <p className="text-xs text-muted-foreground">{next.provider}</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-muted-foreground">—</p>
                      );
                    })()}
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Coverage by Category */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Coverage by Category
            </CardTitle>
            <CardDescription>Insurance coverage breakdown by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Life</span>
                </div>
                <p className="text-xl font-bold">฿{(coverageByCategory.Life / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Health</span>
                </div>
                <p className="text-xl font-bold">฿{(coverageByCategory.Health / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Vehicle</span>
                </div>
                <p className="text-xl font-bold">฿{(coverageByCategory.Vehicle / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Property</span>
                </div>
                <p className="text-xl font-bold">฿{(coverageByCategory.Property / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Other</span>
                </div>
                <p className="text-xl font-bold">฿{(coverageByCategory.Other / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thai Tax Deduction Section */}
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Thai Tax Deduction Tracker
            </CardTitle>
            <CardDescription>Track your insurance premium tax deductions for Thai tax filing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Life Insurance Premium</h4>
                  <Badge variant="outline">Max ฿100,000</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Year Contributions</span>
                    <span className="font-semibold">฿{lifeInsurancePremiums.toLocaleString()}</span>
                  </div>
                  <Progress value={(lifeInsurancePremiums / maxLifeDeduction) * 100} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining Capacity</span>
                    <span className={`font-semibold ${lifeDeductionRemaining === 0 ? "text-success" : "text-warning"}`}>
                      ฿{lifeDeductionRemaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Health Insurance Premium</h4>
                  <Badge variant="outline">Max ฿25,000</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Year Contributions</span>
                    <span className="font-semibold">฿{healthInsurancePremiums.toLocaleString()}</span>
                  </div>
                  <Progress value={(healthInsurancePremiums / maxHealthDeduction) * 100} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining Capacity</span>
                    <span className={`font-semibold ${healthDeductionRemaining === 0 ? "text-success" : "text-warning"}`}>
                      ฿{healthDeductionRemaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Total Potential Tax Deduction:</strong> ฿{actualCombinedDeduction.toLocaleString()}
              </p>
              {rawCombinedDeduction > maxCombinedDeduction && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Combined cap applied: Life + Health cannot exceed ฿{maxCombinedDeduction.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Note: While Life can deduct up to ฿100,000 and Health up to ฿25,000, the combined deduction for both cannot exceed ฿100,000.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="mb-6">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <TabsList>
              <TabsTrigger value="all">All ({policies.length})</TabsTrigger>
              <TabsTrigger value="life">Life</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
              <TabsTrigger value="property">Property</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Insurance Portfolio */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Insurance Portfolio</h3>
          {policiesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading policies...</p>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Insurance Policies</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first insurance policy
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Policy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPolicies.map((policy) => {
                const normalizedType = normalizeType(policy.policy_type);
                const Icon = getTypeIcon(normalizedType);
                const renewalDate = policy.renewal_date ? new Date(policy.renewal_date) : null;
                const startDate = new Date(policy.start_date);
                const urgency = renewalDate ? getRenewalUrgency(renewalDate) : null;
                const daysUntilRenewal = renewalDate ? differenceInDays(renewalDate, new Date()) : null;
                const annualPremium = !policy.premium_frequency
                  ? policy.premium_amount
                  : policy.premium_frequency.toLowerCase() === "monthly"
                    ? policy.premium_amount * 12
                    : policy.premium_frequency.toLowerCase() === "quarterly"
                      ? policy.premium_amount * 4
                      : policy.premium_amount;

                return (
                  <Card key={policy.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <Badge variant={getTypeBadgeVariant(normalizedType)}>{normalizedType}</Badge>
                            <h4 className="font-medium mt-1">{policy.provider}</h4>
                          </div>
                        </div>
                        {daysUntilRenewal !== null && daysUntilRenewal <= 90 && urgency && (
                          <Badge variant={urgency.color}>{urgency.label}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Policy Number</p>
                        <p className="font-mono text-xs">{policy.policy_number}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Coverage</p>
                          <p className="font-semibold">฿{(policy.coverage_amount / 1000000).toFixed(1)}M</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Annual Premium</p>
                          <p className="font-semibold">฿{annualPremium.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                        <div>
                          <p className="text-muted-foreground">Renewal Date</p>
                          {renewalDate ? (
                            <p className="font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(renewalDate, "MMM dd, yyyy")}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">N/A</p>
                          )}
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Payment</p>
                          <p className="font-semibold text-primary">
                            {policy.next_payment_date ? format(new Date(policy.next_payment_date), "MMM dd, yyyy") : (renewalDate ? format(renewalDate, "MMM dd, yyyy") : "N/A")}
                          </p>
                        </div>
                      </div>

                      {policy.last_paid_date && (
                        <div className="text-sm pt-2 border-t">
                          <p className="text-muted-foreground">Last Paid On</p>
                          <p className="font-medium text-success text-xs">
                            {format(new Date(policy.last_paid_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      )}

                      {daysUntilRenewal !== null && daysUntilRenewal <= 90 && (
                        <div className="flex items-center gap-2 p-2 bg-warning/10 rounded text-sm">
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <span>Renews in {daysUntilRenewal} days</span>
                        </div>
                      )}

                      {policy.beneficiaries && (
                        <div className="text-sm pt-2 border-t">
                          <p className="text-muted-foreground">Beneficiaries</p>
                          <p className="text-xs">{policy.beneficiaries}</p>
                        </div>
                      )}

                      {policy.notes && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Notes</p>
                          <p className="text-xs text-muted-foreground">{policy.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t">
                        {/* Payment Status Toggle */}
                        <Button
                          variant={policy.payment_status === 'paid' ? 'default' : 'outline'}
                          size="sm"
                          className={`flex-1 gap-1 ${policy.payment_status === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10'}`}
                          onClick={() => handleTogglePaymentStatus(policy)}
                        >
                          {policy.payment_status === 'paid' ? '✓ Paid' : '○ Mark Paid'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(policy)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeletePolicy(policy.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Renewal Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Renewal Calendar</CardTitle>
            <CardDescription>Upcoming policy renewals</CardDescription>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No policies to display</p>
            ) : policies.filter((policy) => policy.renewal_date !== null).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No policies with renewal dates</p>
            ) : (
              <div className="space-y-3">
                {policies
                  .filter((policy) => policy.renewal_date !== null)
                  .sort((a, b) => new Date(a.renewal_date!).getTime() - new Date(b.renewal_date!).getTime())
                  .map((policy) => {
                    const renewalDate = new Date(policy.renewal_date!);
                    const daysUntil = differenceInDays(renewalDate, new Date());
                    const urgency = getRenewalUrgency(renewalDate);
                    const normalizedType = normalizeType(policy.policy_type);

                    return (
                      <div
                        key={policy.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full ${daysUntil <= 30
                              ? "bg-destructive"
                              : daysUntil <= 60
                                ? "bg-warning"
                                : daysUntil <= 90
                                  ? "bg-secondary"
                                  : "bg-success"
                              }`}
                          ></div>
                          <div>
                            <p className="font-medium">
                              {policy.provider} - {normalizedType}
                            </p>
                            <p className="text-sm text-muted-foreground">{policy.policy_number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{format(renewalDate, "MMM dd, yyyy")}</p>
                          <p className="text-sm text-muted-foreground">{daysUntil} days</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Insurance;
