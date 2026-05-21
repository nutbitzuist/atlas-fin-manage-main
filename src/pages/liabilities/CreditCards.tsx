import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, CreditCard as CreditCardIcon, Calendar, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { CreditCardDialog, CreditCard as CreditCardType } from "@/components/liabilities/CreditCardDialog";
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
import { deleteCreditCardById, getCreditCardsByUser } from "@/services/credit-card-service";

const CreditCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

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

  const fetchCreditCards = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cards = await getCreditCardsByUser(user.id);
      setCreditCards(cards || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load credit cards"),
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (session) {
      fetchCreditCards();
    }
  }, [session, fetchCreditCards]);

  const handleAddCard = () => {
    setSelectedCard(null);
    setIsDialogOpen(true);
  };

  const handleEditCard = (card: CreditCardType) => {
    setSelectedCard(card);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (cardId: string) => {
    setCardToDelete(cardId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteCreditCardById(user.id, cardToDelete);

      toast({
        title: "Success",
        description: "Credit card deleted successfully",
      });

      fetchCreditCards();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete credit card"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  const totalDebt = creditCards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0);
  const averageUtilization = totalCreditLimit > 0 ? (totalDebt / totalCreditLimit) * 100 : 0;

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return "text-success";
    if (utilization < 70) return "text-warning";
    return "text-destructive";
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization < 30) return { text: "Excellent", variant: "default" as const };
    if (utilization < 70) return { text: "Moderate", variant: "secondary" as const };
    return { text: "High", variant: "destructive" as const };
  };

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
            <h2 className="text-3xl font-bold text-foreground mb-2">Credit Cards</h2>
            <p className="text-muted-foreground">Manage your credit card accounts</p>
          </div>
          <Button onClick={handleAddCard}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credit Card
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Credit Card Debt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">฿{totalDebt.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {creditCards.length} cards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">฿{totalCreditLimit.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Available: ฿{(totalCreditLimit - totalDebt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${getUtilizationColor(averageUtilization)}`}>
                {averageUtilization.toFixed(1)}%
              </p>
              <div className="mt-2">
                <Progress
                  value={averageUtilization}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Cards Grid */}
        {creditCards.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {creditCards.map((card) => {
              const utilization = (card.current_balance / card.credit_limit) * 100;
              const status = getUtilizationStatus(utilization);
              const daysUntilDue = card.payment_due_date ? card.payment_due_date - new Date().getDate() : 0;
              const isDueSoon = daysUntilDue <= 7 && daysUntilDue > 0;

              return (
                <Card key={card.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <CreditCardIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{card.issuer}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {card.last_four_digits ? `****${card.last_four_digits}` : "Card"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{card.card_type}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Balance */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Current Balance</span>
                        <span className="text-lg font-bold text-destructive">
                          ฿{card.current_balance.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span className="font-medium">฿{card.credit_limit.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Utilization */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Utilization</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getUtilizationColor(utilization)}`}>
                            {utilization.toFixed(1)}%
                          </span>
                          <Badge variant={status.variant} className="text-xs">
                            {status.text}
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={utilization}
                        className={`h-2 ${
                          utilization < 30 ? "" :
                          utilization < 70 ? "bg-warning/20" : "bg-destructive/20"
                        }`}
                      />
                    </div>

                    {/* Payment Info */}
                    <div className="pt-2 border-t space-y-2">
                      {card.payment_due_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Payment Due
                          </span>
                          <span className="font-medium">
                            Day {card.payment_due_date} {isDueSoon && (
                              <span className="text-warning ml-1">⚠️</span>
                            )}
                          </span>
                        </div>
                      )}
                      {card.minimum_payment && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Minimum Payment</span>
                          <span className="font-medium">฿{card.minimum_payment.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">APR</span>
                        <span className="font-medium">{card.interest_rate}%</span>
                      </div>
                      {card.annual_fee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Annual Fee</span>
                          <span className="font-medium">฿{card.annual_fee.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditCard(card)}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDeleteClick(card.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCardIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No credit cards found</h3>
            <p className="text-muted-foreground mb-4">Add your credit cards to track balances and utilization</p>
            <Button onClick={handleAddCard}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Credit Card
            </Button>
          </div>
        )}

        {/* Utilization Warning */}
        {averageUtilization > 30 && (
          <Card className="mt-6 border-warning">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Credit Utilization Notice</h4>
                  <p className="text-sm text-muted-foreground">
                    Your average credit utilization is {averageUtilization.toFixed(1)}%.
                    Keeping it below 30% can help improve your credit score.
                    Consider paying down balances or requesting credit limit increases.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <CreditCardDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          card={selectedCard}
          onSuccess={fetchCreditCards}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this credit card from your records.
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

export default CreditCards;
