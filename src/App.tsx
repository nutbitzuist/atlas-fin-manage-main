import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Analytics from "./components/Analytics";
import "./i18n/config";
import { YearProvider } from "./contexts/YearContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import PremiumRoute from "./components/PremiumRoute";
import { useProductionErrorReporting } from "./hooks/useProductionErrorReporting";

const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const PublicCalculators = lazy(() => import("./pages/PublicCalculators"));
const PublicGuides = lazy(() => import("./pages/PublicGuides"));
const PublicUseCases = lazy(() => import("./pages/PublicUseCases"));
const PublicTemplates = lazy(() => import("./pages/PublicTemplates"));
const PublicEducation = lazy(() => import("./pages/PublicEducation"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const BillingSuccess = lazy(() => import("./pages/BillingSuccess"));
const BillingCancelled = lazy(() => import("./pages/BillingCancelled"));
const Index = lazy(() => import("./pages/Index"));
const DailyBrief = lazy(() => import("./pages/DailyBrief"));
const WeeklyReview = lazy(() => import("./pages/WeeklyReview"));
const Streaks = lazy(() => import("./pages/Streaks"));
const Assets = lazy(() => import("./pages/Assets"));
const CashAccounts = lazy(() => import("./pages/assets/CashAccounts"));
const Investments = lazy(() => import("./pages/assets/Investments"));
const RealEstate = lazy(() => import("./pages/assets/RealEstate"));
const Vehicles = lazy(() => import("./pages/assets/Vehicles"));
const OtherAssets = lazy(() => import("./pages/assets/OtherAssets"));
const Liabilities = lazy(() => import("./pages/Liabilities"));
const CreditCards = lazy(() => import("./pages/liabilities/CreditCards"));
const Loans = lazy(() => import("./pages/liabilities/Loans"));
const Income = lazy(() => import("./pages/Income"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budget = lazy(() => import("./pages/Budget"));
const CashFlow = lazy(() => import("./pages/CashFlow"));
const Bills = lazy(() => import("./pages/Bills"));
const SavingsGoals = lazy(() => import("./pages/SavingsGoals"));
const Insurance = lazy(() => import("./pages/Insurance"));
const Reports = lazy(() => import("./pages/Reports"));
const TaxPlanning = lazy(() => import("./pages/TaxPlanning"));
const ReportsAnalytics = lazy(() => import("./pages/ReportsAnalytics"));
const NetWorth = lazy(() => import("./pages/NetWorth"));
const FinancialHealth = lazy(() => import("./pages/FinancialHealth"));
const FinancialInsights = lazy(() => import("./pages/FinancialInsights"));
const MonthlyUpdate = lazy(() => import("./pages/MonthlyUpdate"));
const GrowthWorkspace = lazy(() => import("./pages/GrowthWorkspace"));
const Settings = lazy(() => import("./pages/Settings"));
const Categories = lazy(() => import("./pages/settings/Categories"));
const EmergencyFund = lazy(() => import("./pages/settings/EmergencyFund"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});

const routeFallback = (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <YearProvider>
                <AppShell />
                <Suspense fallback={routeFallback}>
                  <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/calculators" element={<PublicCalculators />} />
          <Route path="/calculators/:slug" element={<PublicCalculators />} />
          <Route path="/guides" element={<PublicGuides />} />
          <Route path="/guides/:slug" element={<PublicGuides />} />
          <Route path="/use-cases" element={<PublicUseCases />} />
          <Route path="/use-cases/:slug" element={<PublicUseCases />} />
          <Route path="/templates" element={<PublicTemplates />} />
          <Route path="/templates/:slug" element={<PublicTemplates />} />
          <Route path="/learn" element={<PublicEducation />} />
          <Route path="/learn/:slug" element={<PublicEducation />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/billing/cancel" element={<BillingCancelled />} />

          {/* Protected Routes - Dashboard & App */}
          <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/daily-brief" element={<ProtectedRoute><DailyBrief /></ProtectedRoute>} />
          <Route path="/weekly-review" element={<ProtectedRoute><WeeklyReview /></ProtectedRoute>} />
          <Route path="/streaks" element={<ProtectedRoute><Streaks /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/assets/cash" element={<ProtectedRoute><CashAccounts /></ProtectedRoute>} />
          <Route path="/assets/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
          <Route path="/assets/real-estate" element={<ProtectedRoute><RealEstate /></ProtectedRoute>} />
          <Route path="/assets/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/assets/other" element={<ProtectedRoute><OtherAssets /></ProtectedRoute>} />
          <Route path="/liabilities" element={<ProtectedRoute><Liabilities /></ProtectedRoute>} />
          <Route path="/liabilities/credit-cards" element={<ProtectedRoute><CreditCards /></ProtectedRoute>} />
          <Route path="/liabilities/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
          <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
          <Route path="/cash-flow" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
          <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
          <Route path="/savings-goals" element={<ProtectedRoute><SavingsGoals /></ProtectedRoute>} />
          <Route path="/insurance" element={<ProtectedRoute><Insurance /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/tax-planning" element={<ProtectedRoute><TaxPlanning /></ProtectedRoute>} />
          <Route path="/reports-analytics" element={<ProtectedRoute><ReportsAnalytics /></ProtectedRoute>} />
          <Route path="/net-worth" element={<ProtectedRoute><NetWorth /></ProtectedRoute>} />
          <Route path="/financial-health" element={<ProtectedRoute><FinancialHealth /></ProtectedRoute>} />
          <Route path="/financial-insights" element={<ProtectedRoute><FinancialInsights /></ProtectedRoute>} />
          <Route path="/monthly-update" element={<ProtectedRoute><MonthlyUpdate /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><GrowthWorkspace /></ProtectedRoute>} />
          <Route path="/challenges" element={<ProtectedRoute><GrowthWorkspace /></ProtectedRoute>} />
          <Route path="/household" element={<ProtectedRoute><PremiumRoute feature="household"><GrowthWorkspace /></PremiumRoute></ProtectedRoute>} />
          <Route path="/trust" element={<ProtectedRoute><GrowthWorkspace /></ProtectedRoute>} />
          <Route path="/premium" element={<ProtectedRoute><GrowthWorkspace /></ProtectedRoute>} />
          <Route path="/ai-coach" element={<ProtectedRoute><PremiumRoute feature="ai_coach"><GrowthWorkspace /></PremiumRoute></ProtectedRoute>} />
          <Route path="/lifecycle-emails" element={<ProtectedRoute><GrowthWorkspace /></ProtectedRoute>} />
          <Route path="/growth-dashboard" element={<ProtectedRoute><PremiumRoute feature="growth_dashboard"><GrowthWorkspace /></PremiumRoute></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/settings/emergency-fund" element={<ProtectedRoute><EmergencyFund /></ProtectedRoute>} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </YearProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

const AppShell = () => {
  useProductionErrorReporting();

  return <Analytics />;
};
