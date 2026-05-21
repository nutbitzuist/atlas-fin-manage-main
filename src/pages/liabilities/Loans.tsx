import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Home, Car, Briefcase, Calendar, TrendingDown, Pencil, Trash2, LucideIcon } from "lucide-react";
import { LoanDialog, Loan as LoanType } from "@/components/liabilities/LoanDialog";
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
import { deleteLoanById, getLoansByUser } from "@/services/loan-service";

const Loans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [loans, setLoans] = useState<LoanType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);
  const [dialogLoanType, setDialogLoanType] = useState<string>("home");

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

  const fetchLoans = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const loansData = await getLoansByUser(user.id);
      setLoans(loansData || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load loans"),
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (session) {
      fetchLoans();
    }
  }, [session, fetchLoans]);

  const handleAddLoan = (loanType: string) => {
    setDialogLoanType(loanType);
    setSelectedLoan(null);
    setIsDialogOpen(true);
  };

  const handleEditLoan = (loan: LoanType) => {
    setSelectedLoan(loan);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (loanId: string) => {
    setLoanToDelete(loanId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!loanToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteLoanById(user.id, loanToDelete);

      toast({
        title: "Success",
        description: "Loan deleted successfully",
      });

      fetchLoans();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete loan"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setLoanToDelete(null);
    }
  };

  // Filter loans by type
  const homeLoans = loans.filter(loan => loan.loan_type === "home");
  const carLoans = loans.filter(loan => loan.loan_type === "car");
  const personalLoans = loans.filter(loan => loan.loan_type === "personal");

  const calculatePayoffDate = (startDate: string, termYears: number) => {
    const start = new Date(startDate);
    const payoff = new Date(start);
    payoff.setFullYear(payoff.getFullYear() + termYears);
    return payoff.toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });
  };

  const calculateRemainingMonths = (startDate: string, termYears: number) => {
    const start = new Date(startDate);
    const payoff = new Date(start);
    payoff.setFullYear(payoff.getFullYear() + termYears);
    const now = new Date();
    const diffTime = payoff.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  const calculateTotalInterest = (monthlyPayment: number, termMonths: number, originalAmount: number) => {
    const totalPaid = monthlyPayment * termMonths;
    return totalPaid - originalAmount;
  };

  const totalHomeLoans = homeLoans.reduce((sum, loan) => sum + loan.current_balance, 0);
  const totalCarLoans = carLoans.reduce((sum, loan) => sum + loan.current_balance, 0);
  const totalPersonalLoans = personalLoans.reduce((sum, loan) => sum + loan.current_balance, 0);

  const renderLoanCard = (loan: LoanType, loanType: 'home' | 'car' | 'personal', icon: LucideIcon) => {
    const Icon = icon;
    const progress = ((loan.original_amount - loan.current_balance) / loan.original_amount) * 100;
    const remainingMonths = loan.start_date ? calculateRemainingMonths(loan.start_date, loan.loan_term_years) : 0;
    const payoffDate = loan.start_date ? calculatePayoffDate(loan.start_date, loan.loan_term_years) : "N/A";
    const termMonths = loan.loan_term_years * 12;
    const totalInterest = calculateTotalInterest(loan.monthly_payment, termMonths, loan.original_amount);

    // Simple calculation for principal vs interest in next payment
    const monthlyInterestRate = loan.interest_rate / 100 / 12;
    const interestPortion = loan.current_balance * monthlyInterestRate;
    const principalPortion = loan.monthly_payment - interestPortion;

    return (
      <Card key={loan.id} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{loan.lender}</CardTitle>
                {loanType === 'home' && loan.property_address && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {loan.property_address}
                  </p>
                )}
                {loanType === 'car' && loan.vehicle_details && (
                  <p className="text-xs text-muted-foreground">{loan.vehicle_details}</p>
                )}
                {loanType === 'personal' && loan.loan_purpose && (
                  <p className="text-xs text-muted-foreground">{loan.loan_purpose}</p>
                )}
              </div>
            </div>
            {loanType === 'home' && loan.property_loan_type && (
              <Badge variant="outline">{loan.property_loan_type}</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Loan Amount Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <span className="text-lg font-bold text-destructive">
                ฿{loan.current_balance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">Original Amount</span>
              <span className="font-medium">฿{loan.original_amount.toLocaleString()}</span>
            </div>
            <Progress value={progress} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground">
              {progress.toFixed(1)}% paid off
            </p>
          </div>

          {/* Loan Details */}
          <div className="pt-2 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Payment</span>
              <span className="font-bold">฿{loan.monthly_payment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Interest Rate</span>
              <span className="font-medium">{loan.interest_rate}%</span>
            </div>
            {loan.payment_due_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Payment Due
                </span>
                <span className="font-medium">Day {loan.payment_due_date}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining Term</span>
              <span className="font-medium">{remainingMonths} months</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payoff Date</span>
              <span className="font-medium">{payoffDate}</span>
            </div>
          </div>

          {/* Amortization Info */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Simple Amortization Info</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Interest (estimate)</span>
                <span className="font-medium text-warning">฿{totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Next Payment - Principal</span>
                <span className="font-medium">฿{principalPortion.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Next Payment - Interest</span>
                <span className="font-medium">฿{interestPortion.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Note: Detailed amortization schedule coming in Phase 2
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditLoan(loan)}>
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDeleteClick(loan.id)}>
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Loans</h2>
          <p className="text-muted-foreground">Manage your loan accounts</p>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="home">Home Loans</TabsTrigger>
            <TabsTrigger value="car">Car Loans</TabsTrigger>
            <TabsTrigger value="personal">Personal Loans</TabsTrigger>
          </TabsList>

          {/* Home Loans Tab */}
          <TabsContent value="home" className="space-y-6">
            <div className="flex justify-between items-center">
              <Card className="flex-1 max-w-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Home Loan Debt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">
                    ฿{totalHomeLoans.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {homeLoans.length} {homeLoans.length === 1 ? 'loan' : 'loans'}
                  </p>
                </CardContent>
              </Card>
              <Button onClick={() => handleAddLoan("home")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Home Loan
              </Button>
            </div>

            {homeLoans.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {homeLoans.map((loan) => renderLoanCard(loan, 'home', Home))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No home loans found</h3>
                <p className="text-muted-foreground mb-4">Add your home loans to track payments and payoff dates</p>
                <Button onClick={() => handleAddLoan("home")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Home Loan
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Car Loans Tab */}
          <TabsContent value="car" className="space-y-6">
            <div className="flex justify-between items-center">
              <Card className="flex-1 max-w-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Car Loan Debt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">
                    ฿{totalCarLoans.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {carLoans.length} {carLoans.length === 1 ? 'loan' : 'loans'}
                  </p>
                </CardContent>
              </Card>
              <Button onClick={() => handleAddLoan("car")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Car Loan
              </Button>
            </div>

            {carLoans.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {carLoans.map((loan) => renderLoanCard(loan, 'car', Car))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No car loans found</h3>
                <p className="text-muted-foreground mb-4">Add your car loans to track payments and payoff dates</p>
                <Button onClick={() => handleAddLoan("car")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Car Loan
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Personal Loans Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="flex justify-between items-center">
              <Card className="flex-1 max-w-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Personal Loan Debt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">
                    ฿{totalPersonalLoans.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {personalLoans.length} {personalLoans.length === 1 ? 'loan' : 'loans'}
                  </p>
                </CardContent>
              </Card>
              <Button onClick={() => handleAddLoan("personal")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Personal Loan
              </Button>
            </div>

            {personalLoans.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {personalLoans.map((loan) => renderLoanCard(loan, 'personal', Briefcase))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No personal loans found</h3>
                <p className="text-muted-foreground mb-4">Add your personal loans to track payments and payoff dates</p>
                <Button onClick={() => handleAddLoan("personal")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Personal Loan
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <LoanDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          loan={selectedLoan}
          onSuccess={fetchLoans}
          defaultLoanType={dialogLoanType}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this loan from your records.
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

export default Loans;
