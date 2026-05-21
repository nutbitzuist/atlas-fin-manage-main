import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Crown, RefreshCw, Settings } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { loadSubscriptionSnapshot, type SubscriptionSnapshot } from "@/services/subscription-service";
import { getTierLabel } from "@/utils/feature-gates";

export default function BillingSuccess() {
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const current = await loadSubscriptionSnapshot(session.user.id);
        if (active) setSnapshot(current);
      } catch {
        if (active) setSnapshot(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
      <SEO
        title="Billing Success"
        description="Checkout success page for FinDash OS subscriptions."
        canonical="/billing/success"
        noindex
      />
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center">
        <Card className="w-full shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-3xl">Checkout complete</CardTitle>
                <CardDescription className="mt-1">
                  Your subscription can now be synchronized with your account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Active plan</p>
              <p className="mt-1 text-2xl font-bold">
                {loading ? "Loading..." : getTierLabel(snapshot?.tier || "Free")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                If the provider webhook has not arrived yet, refresh from Settings.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="gap-2">
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                  Open billing settings
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/settings?tab=billing">
                  <RefreshCw className="h-4 w-4" />
                  Refresh subscription
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/dashboard">
                  <Crown className="h-4 w-4" />
                  Go to dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
