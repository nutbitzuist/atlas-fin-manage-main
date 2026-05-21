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
import { createVehicle, updateVehicle } from "@/services/vehicle-service";

export interface Vehicle {
  id: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number;
  purchase_price: number;
  current_value: number;
  purchase_date: string | null;
  license_plate: string | null;
  vin: string | null;
  currency: string;
  description: string | null;
  status: string;
}

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
  onSuccess: () => void;
}

export function VehicleDialog({ open, onOpenChange, vehicle, onSuccess }: VehicleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_type: "Car",
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    purchase_price: "",
    current_value: "",
    purchase_date: "",
    license_plate: "",
    vin: "",
    currency: "THB",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_type: vehicle.vehicle_type,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year.toString(),
        purchase_price: vehicle.purchase_price.toString(),
        current_value: vehicle.current_value.toString(),
        purchase_date: vehicle.purchase_date || "",
        license_plate: vehicle.license_plate || "",
        vin: vehicle.vin || "",
        currency: vehicle.currency,
        description: vehicle.description || "",
        status: vehicle.status,
      });
    } else {
      setFormData({
        vehicle_type: "Car",
        make: "",
        model: "",
        year: new Date().getFullYear().toString(),
        purchase_price: "",
        current_value: "",
        purchase_date: "",
        license_plate: "",
        vin: "",
        currency: "THB",
        description: "",
        status: "active",
      });
    }
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const vehicleData = {
        vehicle_type: formData.vehicle_type,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        purchase_price: parseFloat(formData.purchase_price),
        current_value: parseFloat(formData.current_value),
        purchase_date: formData.purchase_date || null,
        license_plate: formData.license_plate || null,
        vin: formData.vin || null,
        currency: formData.currency,
        description: formData.description || null,
        status: formData.status,
        user_id: user.id,
      };

      if (vehicle) {
        await updateVehicle(vehicle.id, user.id, vehicleData);

        toast({
          title: "Success",
          description: "Vehicle updated successfully",
        });
      } else {
        await createVehicle(vehicleData);

        toast({
          title: "Success",
          description: "Vehicle added successfully",
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
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Update your vehicle details" : "Add a new vehicle to track"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g., Honda, Toyota"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., Civic, Camry"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  placeholder="ABC-1234"
                />
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

            <div className="grid gap-2">
              <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                placeholder="17-character VIN"
                maxLength={17}
              />
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
                    <SelectItem value="sold">Sold</SelectItem>
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
                placeholder="Additional notes about this vehicle"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
