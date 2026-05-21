import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errors";
import { createLoan, updateLoan } from "@/services/loan-service";

export interface Loan {
  id: string;
  loan_type: string;
  lender: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  loan_term_years: number;
  monthly_payment: number;
  payment_due_date: number | null;
  start_date: string | null;
  status: string;
  currency: string;
  description: string | null;
  property_address: string | null;
  property_loan_type: string | null;
  vehicle_details: string | null;
  loan_purpose: string | null;
}

interface LoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan | null;
  onSuccess: () => void;
  defaultLoanType?: string;
}

export function LoanDialog({ open, onOpenChange, loan, onSuccess, defaultLoanType = "home" }: LoanDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loanType, setLoanType] = useState(defaultLoanType);
  const [formData, setFormData] = useState({
    loan_type: defaultLoanType,
    lender: "",
    original_amount: "",
    current_balance: "",
    interest_rate: "",
    loan_term_years: "",
    monthly_payment: "",
    payment_due_date: "",
    start_date: "",
    status: "active",
    currency: "THB",
    description: "",
    property_address: "",
    property_loan_type: "Fixed",
    vehicle_details: "",
    loan_purpose: "",
  });

  useEffect(() => {
    if (loan) {
      setLoanType(loan.loan_type);
      setFormData({
        loan_type: loan.loan_type,
        lender: loan.lender,
        original_amount: loan.original_amount.toString(),
        current_balance: loan.current_balance.toString(),
        interest_rate: loan.interest_rate.toString(),
        loan_term_years: loan.loan_term_years.toString(),
        monthly_payment: loan.monthly_payment.toString(),
        payment_due_date: loan.payment_due_date?.toString() || "",
        start_date: loan.start_date || "",
        status: loan.status,
        currency: loan.currency,
        description: loan.description || "",
        property_address: loan.property_address || "",
        property_loan_type: loan.property_loan_type || "Fixed",
        vehicle_details: loan.vehicle_details || "",
        loan_purpose: loan.loan_purpose || "",
      });
    } else {
      setLoanType(defaultLoanType);
      setFormData({
        loan_type: defaultLoanType,
        lender: "",
        original_amount: "",
        current_balance: "",
        interest_rate: "",
        loan_term_years: "",
        monthly_payment: "",
        payment_due_date: "",
        start_date: "",
        status: "active",
        currency: "THB",
        description: "",
        property_address: "",
        property_loan_type: "Fixed",
        vehicle_details: "",
        loan_purpose: "",
      });
    }
  }, [loan, open, defaultLoanType]);

  const handleLoanTypeChange = (value: string) => {
    setLoanType(value);
    setFormData({ ...formData, loan_type: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const loanData = {
        loan_type: formData.loan_type,
        lender: formData.lender,
        original_amount: parseFloat(formData.original_amount),
        current_balance: parseFloat(formData.current_balance),
        interest_rate: parseFloat(formData.interest_rate),
        loan_term_years: parseInt(formData.loan_term_years),
        monthly_payment: parseFloat(formData.monthly_payment),
        payment_due_date: formData.payment_due_date ? parseInt(formData.payment_due_date) : null,
        start_date: formData.start_date || null,
        status: formData.status,
        currency: formData.currency,
        description: formData.description || null,
        property_address: formData.loan_type === "home" ? formData.property_address || null : null,
        property_loan_type: formData.loan_type === "home" ? formData.property_loan_type || null : null,
        vehicle_details: formData.loan_type === "car" ? formData.vehicle_details || null : null,
        loan_purpose: formData.loan_type === "personal" ? formData.loan_purpose || null : null,
        user_id: user.id,
      };

      if (loan) {
        await updateLoan(loan.id, user.id, loanData);

        toast({
          title: "Success",
          description: "Loan updated successfully",
        });
      } else {
        await createLoan(loanData);

        toast({
          title: "Success",
          description: "Loan added successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loan ? "Edit Loan" : "Add Loan"}</DialogTitle>
          <DialogDescription>
            {loan ? "Update your loan details" : "Add a new loan to track"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="loan_type">Loan Type *</Label>
                <Select
                  value={loanType}
                  onValueChange={handleLoanTypeChange}
                  disabled={!!loan}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home Loan</SelectItem>
                    <SelectItem value="car">Car Loan</SelectItem>
                    <SelectItem value="personal">Personal Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lender">Lender / Bank *</Label>
                <Input
                  id="lender"
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  placeholder="e.g., Bangkok Bank"
                  required
                />
              </div>
            </div>

            {/* Type-specific fields */}
            {loanType === "home" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="property_address">Property Address</Label>
                  <Input
                    id="property_address"
                    value={formData.property_address}
                    onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                    placeholder="123 Sukhumvit Road, Bangkok"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="property_loan_type">Loan Type</Label>
                  <Select
                    value={formData.property_loan_type}
                    onValueChange={(value) => setFormData({ ...formData, property_loan_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed Rate</SelectItem>
                      <SelectItem value="Variable">Variable Rate</SelectItem>
                      <SelectItem value="Mixed">Mixed Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {loanType === "car" && (
              <div className="grid gap-2">
                <Label htmlFor="vehicle_details">Vehicle Details</Label>
                <Input
                  id="vehicle_details"
                  value={formData.vehicle_details}
                  onChange={(e) => setFormData({ ...formData, vehicle_details: e.target.value })}
                  placeholder="e.g., 2021 Honda Civic"
                />
              </div>
            )}

            {loanType === "personal" && (
              <div className="grid gap-2">
                <Label htmlFor="loan_purpose">Loan Purpose</Label>
                <Input
                  id="loan_purpose"
                  value={formData.loan_purpose}
                  onChange={(e) => setFormData({ ...formData, loan_purpose: e.target.value })}
                  placeholder="e.g., Home Renovation"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="original_amount">Original Amount (฿) *</Label>
                <Input
                  id="original_amount"
                  type="number"
                  step="0.01"
                  value={formData.original_amount}
                  onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="current_balance">Current Balance (฿) *</Label>
                <Input
                  id="current_balance"
                  type="number"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="5.00"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="loan_term_years">Loan Term (Years) *</Label>
                <Input
                  id="loan_term_years"
                  type="number"
                  min="1"
                  value={formData.loan_term_years}
                  onChange={(e) => setFormData({ ...formData, loan_term_years: e.target.value })}
                  placeholder="20"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="monthly_payment">Monthly Payment (฿) *</Label>
                <Input
                  id="monthly_payment"
                  type="number"
                  step="0.01"
                  value={formData.monthly_payment}
                  onChange={(e) => setFormData({ ...formData, monthly_payment: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_due_date">Payment Due Date (Day of Month)</Label>
                <Input
                  id="payment_due_date"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.payment_due_date}
                  onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">THB (฿)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paid_off">Paid Off</SelectItem>
                  <SelectItem value="refinanced">Refinanced</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes about this loan"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : loan ? "Update Loan" : "Add Loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
