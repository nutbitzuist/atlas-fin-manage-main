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
import { createCashAccount, updateCashAccount } from "@/services/cash-account-service";

interface CashAccount {
  id: string;
  bank_name: string;
  account_type: string;
  account_number: string | null;
  balance: number;
  currency: string;
  interest_rate: number | null;
  status: string;
  description: string | null;
}

interface CashAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: CashAccount | null;
  onSuccess: () => void;
}

export function CashAccountDialog({ open, onOpenChange, account, onSuccess }: CashAccountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_type: "Savings",
    account_number: "",
    balance: "",
    currency: "THB",
    interest_rate: "",
    status: "active",
    description: "",
  });

  useEffect(() => {
    if (account) {
      setFormData({
        bank_name: account.bank_name,
        account_type: account.account_type,
        account_number: account.account_number || "",
        balance: account.balance.toString(),
        currency: account.currency,
        interest_rate: account.interest_rate?.toString() || "",
        status: account.status,
        description: account.description || "",
      });
    } else {
      setFormData({
        bank_name: "",
        account_type: "Savings",
        account_number: "",
        balance: "",
        currency: "THB",
        interest_rate: "",
        status: "active",
        description: "",
      });
    }
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const accountData = {
        bank_name: formData.bank_name,
        account_type: formData.account_type,
        account_number: formData.account_number || null,
        balance: parseFloat(formData.balance) || 0,
        currency: formData.currency,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        status: formData.status,
        description: formData.description || null,
        user_id: user.id,
      };

      if (account) {
        // Update existing account
        await updateCashAccount(account.id, user.id, accountData);

        toast({
          title: "Success",
          description: "Cash account updated successfully",
        });
      } else {
        // Create new account
        await createCashAccount(accountData);

        toast({
          title: "Success",
          description: "Cash account created successfully",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Cash Account" : "Add Cash Account"}</DialogTitle>
          <DialogDescription>
            {account ? "Update your cash account details" : "Add a new bank account to track"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="e.g., Bangkok Bank"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account_type">Account Type *</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Fixed Deposit">Fixed Deposit</SelectItem>
                  <SelectItem value="Current">Current</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account_number">Account Number (Last 4 digits)</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="1234"
                maxLength={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="balance">Balance *</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  placeholder="0.00"
                  required
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interest_rate">Interest Rate (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="0.00"
                />
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
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional notes about this account"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : account ? "Update Account" : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
