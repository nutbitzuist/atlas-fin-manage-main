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
import { createCreditCard, updateCreditCard } from "@/services/credit-card-service";

export interface CreditCard {
  id: string;
  issuer: string;
  card_type: string;
  last_four_digits: string | null;
  current_balance: number;
  credit_limit: number;
  interest_rate: number;
  payment_due_date: number | null;
  minimum_payment: number | null;
  annual_fee: number;
  status: string;
  description: string | null;
}

interface CreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: CreditCard | null;
  onSuccess: () => void;
}

export function CreditCardDialog({ open, onOpenChange, card, onSuccess }: CreditCardDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    issuer: "",
    card_type: "Visa",
    last_four_digits: "",
    current_balance: "",
    credit_limit: "",
    interest_rate: "",
    payment_due_date: "",
    minimum_payment: "",
    annual_fee: "",
    status: "active",
    description: "",
  });

  useEffect(() => {
    if (card) {
      setFormData({
        issuer: card.issuer,
        card_type: card.card_type,
        last_four_digits: card.last_four_digits || "",
        current_balance: card.current_balance.toString(),
        credit_limit: card.credit_limit.toString(),
        interest_rate: card.interest_rate.toString(),
        payment_due_date: card.payment_due_date?.toString() || "",
        minimum_payment: card.minimum_payment?.toString() || "",
        annual_fee: card.annual_fee.toString(),
        status: card.status,
        description: card.description || "",
      });
    } else {
      setFormData({
        issuer: "",
        card_type: "Visa",
        last_four_digits: "",
        current_balance: "",
        credit_limit: "",
        interest_rate: "",
        payment_due_date: "",
        minimum_payment: "",
        annual_fee: "0",
        status: "active",
        description: "",
      });
    }
  }, [card, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const cardData = {
        issuer: formData.issuer,
        card_type: formData.card_type,
        last_four_digits: formData.last_four_digits || null,
        current_balance: parseFloat(formData.current_balance),
        credit_limit: parseFloat(formData.credit_limit),
        interest_rate: parseFloat(formData.interest_rate),
        payment_due_date: formData.payment_due_date ? parseInt(formData.payment_due_date) : null,
        minimum_payment: formData.minimum_payment ? parseFloat(formData.minimum_payment) : null,
        annual_fee: parseFloat(formData.annual_fee || "0"),
        status: formData.status,
        description: formData.description || null,
        user_id: user.id,
      };

      if (card) {
        await updateCreditCard(card.id, user.id, cardData);

        toast({
          title: "Success",
          description: "Credit card updated successfully",
        });
      } else {
        await createCreditCard(cardData);

        toast({
          title: "Success",
          description: "Credit card added successfully",
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
          <DialogTitle>{card ? "Edit Credit Card" : "Add Credit Card"}</DialogTitle>
          <DialogDescription>
            {card ? "Update your credit card details" : "Add a new credit card to track"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="issuer">Issuer / Bank *</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  placeholder="e.g., Bangkok Bank, SCB"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="card_type">Card Type *</Label>
                <Select
                  value={formData.card_type}
                  onValueChange={(value) => setFormData({ ...formData, card_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="Amex">American Express</SelectItem>
                    <SelectItem value="JCB">JCB</SelectItem>
                    <SelectItem value="UnionPay">UnionPay</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="last_four_digits">Last 4 Digits</Label>
              <Input
                id="last_four_digits"
                value={formData.last_four_digits}
                onChange={(e) => setFormData({ ...formData, last_four_digits: e.target.value })}
                placeholder="1234"
                maxLength={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="grid gap-2">
                <Label htmlFor="credit_limit">Credit Limit (฿) *</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interest_rate">Interest Rate (APR %) *</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="18.00"
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
                  placeholder="15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minimum_payment">Minimum Payment (฿)</Label>
                <Input
                  id="minimum_payment"
                  type="number"
                  step="0.01"
                  value={formData.minimum_payment}
                  onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="annual_fee">Annual Fee (฿)</Label>
                <Input
                  id="annual_fee"
                  type="number"
                  step="0.01"
                  value={formData.annual_fee}
                  onChange={(e) => setFormData({ ...formData, annual_fee: e.target.value })}
                  placeholder="0.00"
                />
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
                  <SelectItem value="closed">Closed</SelectItem>
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
                placeholder="Additional notes about this credit card"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : card ? "Update Card" : "Add Card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
