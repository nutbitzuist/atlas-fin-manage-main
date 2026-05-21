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
import { createOtherAsset, updateOtherAsset } from "@/services/other-asset-service";

export interface OtherAsset {
  id: string;
  asset_name: string;
  category: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  quantity: number | null;
  currency: string;
  description: string | null;
  status: string;
}

interface OtherAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: OtherAsset | null;
  onSuccess: () => void;
}

export function OtherAssetDialog({ open, onOpenChange, asset, onSuccess }: OtherAssetDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset_name: "",
    category: "Cryptocurrency",
    purchase_price: "",
    current_value: "",
    purchase_date: "",
    quantity: "",
    currency: "THB",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        asset_name: asset.asset_name,
        category: asset.category,
        purchase_price: asset.purchase_price.toString(),
        current_value: asset.current_value.toString(),
        purchase_date: asset.purchase_date || "",
        quantity: asset.quantity?.toString() || "",
        currency: asset.currency,
        description: asset.description || "",
        status: asset.status,
      });
    } else {
      setFormData({
        asset_name: "",
        category: "Cryptocurrency",
        purchase_price: "",
        current_value: "",
        purchase_date: "",
        quantity: "",
        currency: "THB",
        description: "",
        status: "active",
      });
    }
  }, [asset, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const assetData = {
        asset_name: formData.asset_name,
        category: formData.category,
        purchase_price: parseFloat(formData.purchase_price),
        current_value: parseFloat(formData.current_value),
        purchase_date: formData.purchase_date || null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        currency: formData.currency,
        description: formData.description || null,
        status: formData.status,
        user_id: user.id,
      };

      if (asset) {
        await updateOtherAsset(asset.id, user.id, assetData);

        toast({
          title: "Success",
          description: "Asset updated successfully",
        });
      } else {
        await createOtherAsset(assetData);

        toast({
          title: "Success",
          description: "Asset added successfully",
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
          <DialogTitle>{asset ? "Edit Asset" : "Add Other Asset"}</DialogTitle>
          <DialogDescription>
            {asset ? "Update your asset details" : "Add cryptocurrency, precious metals, collectibles, and more"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="asset_name">Asset Name *</Label>
              <Input
                id="asset_name"
                value={formData.asset_name}
                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                placeholder="e.g., Bitcoin, Gold Bar, Rolex Watch"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cryptocurrency">Cryptocurrency</SelectItem>
                    <SelectItem value="Precious Metals">Precious Metals</SelectItem>
                    <SelectItem value="Collectibles">Collectibles</SelectItem>
                    <SelectItem value="Art">Art</SelectItem>
                    <SelectItem value="Jewelry">Jewelry</SelectItem>
                    <SelectItem value="Antiques">Antiques</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.0001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 1, 0.5, 100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchase_price">Purchase Price *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="current_value">Current Value *</Label>
                <Input
                  id="current_value"
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
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
                  <SelectItem value="sold">Sold</SelectItem>
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
                placeholder="Additional notes about this asset"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : asset ? "Update Asset" : "Add Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
