import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, Calendar, Pencil, Trash2 } from "lucide-react";
import { VehicleDialog, Vehicle as VehicleType } from "@/components/assets/VehicleDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getProfileDisplayName } from "@/services/profile-service";
import { getErrorMessage } from "@/utils/errors";
import { deleteVehicleById, getVehiclesByUser } from "@/services/vehicle-service";

const Vehicles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

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
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const fullName = await getProfileDisplayName(userId);
    setUserName(fullName || "User");
  };

  const fetchVehicles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const vehicles = await getVehiclesByUser(user.id);
      setVehicles(vehicles || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load vehicles"),
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (session) {
      fetchVehicles();
    }
  }, [session, fetchVehicles]);

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setIsDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: VehicleType) => {
    setSelectedVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (vehicleId: string) => {
    setVehicleToDelete(vehicleId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteVehicleById(user.id, vehicleToDelete);

      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });

      fetchVehicles();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete vehicle"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const totalValue = vehicles.reduce((sum, v) => sum + v.current_value, 0);
  const totalDepreciation = vehicles.reduce((sum, v) => sum + (v.purchase_price - v.current_value), 0);

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

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Vehicles</h2>
            <p className="text-muted-foreground">Manage your vehicle assets</p>
          </div>
          <Button onClick={handleAddVehicle}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Vehicle Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">฿{totalValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{vehicles.length} vehicles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Depreciation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">-฿{totalDepreciation.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Since purchase</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Age</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {vehicles.length > 0
                  ? (vehicles.reduce((sum, v) => sum + (new Date().getFullYear() - v.year), 0) / vehicles.length).toFixed(1)
                  : 0} years
              </p>
              <p className="text-xs text-muted-foreground mt-1">Across all vehicles</p>
            </CardContent>
          </Card>
        </div>

        {/* Vehicles Grid */}
        {vehicles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={vehicle.vehicle_type === "Car" ? "default" : "secondary"}>
                      {vehicle.vehicle_type}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Purchase Price</span>
                      <span className="font-medium">฿{vehicle.purchase_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Value</span>
                      <span className="font-bold">฿{vehicle.current_value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Depreciation</span>
                      <span className="font-medium text-destructive">
                        -฿{(vehicle.purchase_price - vehicle.current_value).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Value Loss</span>
                      <span className="font-medium text-destructive">
                        -{(((vehicle.purchase_price - vehicle.current_value) / vehicle.purchase_price) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {vehicle.purchase_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      <span>Purchased: {vehicle.purchase_date}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditVehicle(vehicle)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDeleteClick(vehicle.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-4">Add your vehicles to track their value</p>
            <Button onClick={handleAddVehicle}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <VehicleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          vehicle={selectedVehicle}
          onSuccess={fetchVehicles}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this vehicle from your records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Vehicles;
