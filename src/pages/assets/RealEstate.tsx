import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, MapPin, Calendar, DollarSign, Pencil, Trash2 } from "lucide-react";
import { RealEstateDialog, RealEstate as RealEstateType } from "@/components/assets/RealEstateDialog";
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
import { deleteRealEstateById, getRealEstateByUser } from "@/services/real-estate-service";

const RealEstate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [properties, setProperties] = useState<RealEstateType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<RealEstateType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

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

  const fetchProperties = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const propertiesData = await getRealEstateByUser(user.id);
      setProperties(propertiesData || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load properties"),
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (session) {
      fetchProperties();
    }
  }, [session, fetchProperties]);

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setIsDialogOpen(true);
  };

  const handleEditProperty = (property: RealEstateType) => {
    setSelectedProperty(property);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteRealEstateById(user.id, propertyToDelete);

      toast({
        title: "Success",
        description: "Property deleted successfully",
      });

      fetchProperties();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete property"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const totalValue = properties.reduce((sum, p) => sum + p.current_value, 0);
  const totalRentalIncome = properties.reduce((sum, p) => sum + (p.rental_income || 0), 0);

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
            <h2 className="text-3xl font-bold text-foreground mb-2">Real Estate</h2>
            <p className="text-muted-foreground">Manage your property portfolio</p>
          </div>
          <Button onClick={handleAddProperty}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Real Estate Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">฿{totalValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{properties.length} properties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Rental Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">฿{totalRentalIncome.toLocaleString()}/mo</p>
              <p className="text-xs text-muted-foreground mt-1">
                {properties.filter(p => (p.rental_income || 0) > 0).length} generating income
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {properties.length > 0
                  ? ((properties.filter(p => p.rental_status === "Occupied").length / properties.length) * 100).toFixed(0)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {properties.filter(p => p.rental_status === "Occupied").length} occupied
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={
                      property.property_type === "Primary Residence" ? "default" :
                      property.property_type === "Rental" ? "secondary" : "outline"
                    }>
                      {property.property_type}
                    </Badge>
                  </div>
                  <CardTitle className="text-base line-clamp-2">{property.address}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{property.address.split(",")[1] || property.address}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Purchase Price</span>
                      <span className="font-medium">฿{property.purchase_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Value</span>
                      <span className="font-bold">฿{property.current_value.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gain</span>
                      <span className="font-medium text-success">
                        +฿{(property.current_value - property.purchase_price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {(property.rental_income || 0) > 0 && (
                    <div className="flex items-center justify-between p-2 bg-success/10 rounded-md">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">฿{property.rental_income?.toLocaleString()}/mo</span>
                      </div>
                      <Badge variant="outline" className="text-success border-success">
                        {property.rental_status}
                      </Badge>
                    </div>
                  )}

                  {property.purchase_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <Calendar className="h-3 w-3" />
                      <span>Purchased: {property.purchase_date}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditProperty(property)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDeleteClick(property.id)}>
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
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-4">Start building your real estate portfolio</p>
            <Button onClick={handleAddProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <RealEstateDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          property={selectedProperty}
          onSuccess={fetchProperties}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this property from your records.
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

export default RealEstate;
