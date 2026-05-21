import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Settings } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingCancelled() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 px-4 py-12">
      <SEO
        title="Billing Cancelled"
        description="Checkout cancel page for FinDash OS subscriptions."
        canonical="/billing/cancel"
        noindex
      />
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center">
        <Card className="w-full shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-3xl">Checkout cancelled</CardTitle>
                <CardDescription className="mt-1">
                  No billing changes were made. You can try again anytime.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Your core finance features remain available. If you were trying to upgrade, use Settings or return to the pricing page.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="gap-2">
                <Link to="/settings?tab=billing">
                  <Settings className="h-4 w-4" />
                  Open billing settings
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Return home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
