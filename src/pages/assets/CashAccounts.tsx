import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { CashAccountDialog } from "@/components/assets/CashAccountDialog";
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
import {
  deleteCashAccountById,
  getCashAccountsByUserFull,
} from "@/services/cash-account-service";

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

const CashAccounts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CashAccount | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

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

  const fetchAccounts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const accounts = await getCashAccountsByUserFull(user.id);
      setAccounts(accounts || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load cash accounts"),
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session, fetchAccounts]);

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setIsDialogOpen(true);
  };

  const handleEditAccount = (account: CashAccount) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (accountId: string) => {
    setAccountToDelete(accountId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteCashAccountById(user.id, accountToDelete);

      toast({
        title: "Success",
        description: "Cash account deleted successfully",
      });

      fetchAccounts();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete cash account"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const totalCash = accounts
    .filter(a => filter === "all" || a.status === filter)
    .reduce((sum, acc) => sum + acc.balance, 0);

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
            <h2 className="text-3xl font-bold text-foreground mb-2">Cash Accounts</h2>
            <p className="text-muted-foreground">Manage your bank accounts</p>
          </div>
          <Button onClick={handleAddAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>

        {/* Total Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Total Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ฿{totalCash.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {accounts.filter(a => filter === "all" || a.status === filter).length} accounts
            </p>
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={filter === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("archived")}
          >
            Archived
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
        </div>

        {/* Accounts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts
            .filter(account => filter === "all" || account.status === filter)
            .map((account) => (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{account.bank_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {account.account_number ? `****${account.account_number}` : "No account number"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{account.account_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                      <p className="text-2xl font-bold">
                        {account.currency === "THB" ? "฿" : account.currency === "USD" ? "$" : "€"}
                        {account.balance.toLocaleString()}
                      </p>
                    </div>

                    {account.interest_rate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Interest Rate</span>
                        <span className="font-medium">{account.interest_rate}%</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditAccount(account)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDeleteClick(account.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* No accounts message */}
        {accounts.filter(account => filter === "all" || account.status === filter).length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cash accounts found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === "active" ? "You don't have any active accounts yet." :
               filter === "archived" ? "You don't have any archived accounts." :
               "You don't have any accounts yet."}
            </p>
            <Button onClick={handleAddAccount}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Account
            </Button>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <CashAccountDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          account={selectedAccount}
          onSuccess={fetchAccounts}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this cash account from your records.
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

export default CashAccounts;
