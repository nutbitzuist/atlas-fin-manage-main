import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { OtherAssetDialog, OtherAsset as OtherAssetType } from "@/components/assets/OtherAssetDialog";
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
import { deleteOtherAssetById, getOtherAssetsByUser } from "@/services/other-asset-service";

const OtherAssets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [otherAssets, setOtherAssets] = useState<OtherAssetType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<OtherAssetType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

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

  const fetchAssets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const assets = await getOtherAssetsByUser(user.id);
      setOtherAssets(assets || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load assets"),
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (session) {
      fetchAssets();
    }
  }, [session, fetchAssets]);

  const handleAddAsset = () => {
    setSelectedAsset(null);
    setIsDialogOpen(true);
  };

  const handleEditAsset = (asset: OtherAssetType) => {
    setSelectedAsset(asset);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (assetId: string) => {
    setAssetToDelete(assetId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteOtherAssetById(user.id, assetToDelete);

      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });

      fetchAssets();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete asset"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAssetToDelete(null);
    }
  };

  const totalValue = otherAssets.reduce((sum, a) => sum + a.current_value, 0);
  const totalGain = otherAssets.reduce((sum, a) => sum + (a.current_value - a.purchase_price), 0);

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
            <h2 className="text-3xl font-bold text-foreground mb-2">Other Assets</h2>
            <p className="text-muted-foreground">
              Crypto, precious metals, collectibles, and more
            </p>
          </div>
          <Button onClick={handleAddAsset}>
            <Plus className="h-4 w-4 mr-2" />
            Add Other Asset
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">฿{totalValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{otherAssets.length} assets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>
                {totalGain >= 0 ? "+" : ""}฿{totalGain.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {otherAssets.reduce((sum, a) => sum + a.purchase_price, 0) > 0
                  ? ((totalGain / otherAssets.reduce((sum, a) => sum + a.purchase_price, 0)) * 100).toFixed(2)
                  : 0}% return
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assets Table */}
        <Card>
          <CardContent className="pt-6">
            {otherAssets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherAssets.map((asset) => {
                    const gainLoss = asset.current_value - asset.purchase_price;
                    const gainLossPercent = ((gainLoss / asset.purchase_price) * 100);

                    return (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.asset_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{asset.purchase_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ฿{asset.current_value.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={gainLoss >= 0 ? "text-success" : "text-destructive"}>
                            <div className="font-medium">
                              {gainLoss >= 0 ? "+" : ""}฿{gainLoss.toLocaleString()}
                            </div>
                            <div className="text-xs">
                              {gainLossPercent >= 0 ? "+" : ""}{gainLossPercent.toFixed(2)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {asset.purchase_date || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditAsset(asset)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(asset.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No other assets found</p>
                <Button className="mt-4" onClick={handleAddAsset}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Asset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <OtherAssetDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          asset={selectedAsset}
          onSuccess={fetchAssets}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this asset from your records.
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

export default OtherAssets;
