import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { createSavingsGoal } from "@/services/savings-goal-service";
import { getErrorMessage } from "@/utils/errors";

interface AddSavingsGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SAVINGS_CATEGORIES = [
  "Emergency Fund",
  "Vacation",
  "Home Purchase",
  "Car Purchase",
  "Education",
  "Retirement",
  "Wedding",
  "Investment",
  "Other"
];

export const AddSavingsGoalDialog = ({
  open,
  onOpenChange,
  onSuccess
}: AddSavingsGoalDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    category: "",
    target_date: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await createSavingsGoal(user.id, {
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: formData.current_amount ? parseFloat(formData.current_amount) : 0,
        category: formData.category || null,
        target_date: formData.target_date || null,
        description: formData.description || null,
        currency: "THB",
      });

      toast({
        title: "Success!",
        description: "Savings goal added successfully",
      });

      setFormData({
        name: "",
        target_amount: "",
        current_amount: "",
        category: "",
        target_date: "",
        description: "",
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
          <DialogTitle>Add Savings Goal</DialogTitle>
          <DialogDescription>
            Set a new savings goal to track your progress
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Emergency Fund, Vacation"
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
                  {SAVINGS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target_amount">Target Amount (฿)</Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="current_amount">Current Amount (฿)</Label>
              <Input
                id="current_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Optional - Leave blank if starting from zero
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target_date">Target Date (Optional)</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this goal..."
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
              {loading ? "Adding..." : "Add Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
