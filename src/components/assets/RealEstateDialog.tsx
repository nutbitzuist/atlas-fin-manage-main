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
import { createRealEstate, updateRealEstate } from "@/services/real-estate-service";

export interface RealEstate {
  id: string;
  address: string;
  property_type: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  rental_income: number | null;
  rental_status: string | null;
  currency: string;
  description: string | null;
  status: string;
}

interface RealEstateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: RealEstate | null;
  onSuccess: () => void;
}

export function RealEstateDialog({ open, onOpenChange, property, onSuccess }: RealEstateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    property_type: "Primary Residence",
    purchase_price: "",
    current_value: "",
    purchase_date: "",
    rental_income: "",
    rental_status: "N/A",
    currency: "THB",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (property) {
      setFormData({
        address: property.address,
        property_type: property.property_type,
        purchase_price: property.purchase_price.toString(),
        current_value: property.current_value.toString(),
        purchase_date: property.purchase_date || "",
        rental_income: property.rental_income?.toString() || "",
        rental_status: property.rental_status || "N/A",
        currency: property.currency,
        description: property.description || "",
        status: property.status,
      });
    } else {
      setFormData({
        address: "",
        property_type: "Primary Residence",
        purchase_price: "",
        current_value: "",
        purchase_date: "",
        rental_income: "",
        rental_status: "N/A",
        currency: "THB",
        description: "",
        status: "active",
      });
    }
  }, [property, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const propertyData = {
        address: formData.address,
        property_type: formData.property_type,
        purchase_price: parseFloat(formData.purchase_price),
        current_value: parseFloat(formData.current_value),
        purchase_date: formData.purchase_date || null,
        rental_income: formData.rental_income ? parseFloat(formData.rental_income) : 0,
        rental_status: formData.rental_status || "N/A",
        currency: formData.currency,
        description: formData.description || null,
        status: formData.status,
        user_id: user.id,
      };

      if (property) {
        await updateRealEstate(property.id, user.id, propertyData);

        toast({
          title: "Success",
          description: "Property updated successfully",
        });
      } else {
        await createRealEstate(propertyData);

        toast({
          title: "Success",
          description: "Property added successfully",
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
          <DialogTitle>{property ? "Edit Property" : "Add Property"}</DialogTitle>
          <DialogDescription>
            {property ? "Update your property details" : "Add a new property to your portfolio"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, Bangkok"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary Residence">Primary Residence</SelectItem>
                    <SelectItem value="Rental">Rental</SelectItem>
                    <SelectItem value="Land">Land</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
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
                <Label htmlFor="rental_income">Monthly Rental Income</Label>
                <Input
                  id="rental_income"
                  type="number"
                  step="0.01"
                  value={formData.rental_income}
                  onChange={(e) => setFormData({ ...formData, rental_income: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rental_status">Rental Status</Label>
                <Select
                  value={formData.rental_status}
                  onValueChange={(value) => setFormData({ ...formData, rental_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner Occupied">Owner Occupied</SelectItem>
                    <SelectItem value="Occupied">Occupied</SelectItem>
                    <SelectItem value="Vacant">Vacant</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                placeholder="Additional notes about this property"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : property ? "Update Property" : "Add Property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
