import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errors";
import { createBill, updateBill } from "@/services/bill-service";
import { getCashAccountsByUser } from "@/services/cash-account-service";

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

interface BankAccountOption {
  id: string;
  bank_name: string;
  account_type: string;
}

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editingBill?: Bill | null;
}

const BILL_CATEGORIES = [
  "Rent/Mortgage",
  "Utilities",
  "Internet",
  "Phone",
  "Insurance",
  "Subscriptions",
  "Loan Payment",
  "Credit Card",
  "Other"
];

const RECURRENCE_PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export const AddBillDialog = ({
  open,
  onOpenChange,
  onSuccess,
  editingBill
}: AddBillDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category: "",
    due_date: "",
    is_recurring: false,
    recurrence_period: "monthly",
    description: "",
    auto_pay: false,
    account_id: "",
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);

  // Fetch bank accounts for selection
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const accounts = await getCashAccountsByUser(user.id, "active");
      if (accounts) setBankAccounts(accounts);
    };
    if (open) fetchAccounts();
  }, [open]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingBill) {
      setFormData({
        name: editingBill.name,
        amount: editingBill.amount.toString(),
        category: editingBill.category || "",
        due_date: editingBill.due_date,
        is_recurring: editingBill.is_recurring,
        recurrence_period: editingBill.recurrence_period || "monthly",
        description: editingBill.description || "",
        auto_pay: editingBill.auto_pay || false,
        account_id: editingBill.account_id || "",
      });
    } else {
      setFormData({
        name: "",
        amount: "",
        category: "",
        due_date: "",
        is_recurring: false,
        recurrence_period: "monthly",
        description: "",
        auto_pay: false,
        account_id: "",
      });
    }
  }, [editingBill, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const billData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        category: formData.category || null,
        due_date: formData.due_date,
        is_recurring: formData.is_recurring,
        recurrence_period: formData.is_recurring ? formData.recurrence_period : null,
        description: formData.description || null,
        auto_pay: formData.auto_pay,
        account_id: formData.account_id || null,
      };

      if (editingBill) {
        // Update existing bill
        await updateBill(editingBill.id, user.id, billData);

        toast({
          title: "Success!",
          description: "Bill updated successfully",
        });
      } else {
        // Insert new bill
        await createBill({
          user_id: user.id,
          currency: 'THB',
          is_paid: false,
          ...billData,
        });

        toast({
          title: "Success!",
          description: "Bill added successfully",
        });
      }

      setFormData({
        name: "",
        amount: "",
        category: "",
        due_date: "",
        is_recurring: false,
        recurrence_period: "monthly",
        description: "",
        auto_pay: false,
        account_id: "",
      });

      onOpenChange(false);
      onSuccess?.();
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingBill ? "Edit Bill" : "Add Bill"}</DialogTitle>
          <DialogDescription>
            {editingBill ? "Update your bill or subscription" : "Add a bill or subscription to track"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Bill Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Electric Bill, Netflix"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {BILL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (฿)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_recurring: checked as boolean })
                }
              />
              <Label htmlFor="recurring" className="text-sm font-normal cursor-pointer">
                This is a recurring bill
              </Label>
            </div>

            {formData.is_recurring && (
              <div className="grid gap-2">
                <Label htmlFor="recurrence">Recurrence Period</Label>
                <Select
                  value={formData.recurrence_period}
                  onValueChange={(value) => setFormData({ ...formData, recurrence_period: value })}
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.is_recurring && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autopay"
                  checked={formData.auto_pay}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, auto_pay: checked as boolean })
                  }
                />
                <Label htmlFor="autopay" className="text-sm font-normal cursor-pointer">
                  Auto-pay & record this expense
                </Label>
              </div>
            )}

            {(formData.is_recurring || formData.auto_pay) && (
              <div className="grid gap-2">
                <Label htmlFor="account">Payment Account</Label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                >
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select account (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for tracking which account the expense is deducted from.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (editingBill ? "Updating..." : "Adding...")
                : (editingBill ? "Update Bill" : "Add Bill")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
