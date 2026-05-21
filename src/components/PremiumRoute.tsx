import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Crown, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPremiumSelection } from "@/data/growth-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  featureGateConfig,
  getTierLabel,
  isFeatureAvailable,
  type PremiumFeature,
  type PremiumTier,
} from "@/utils/feature-gates";

interface PremiumRouteProps {
  feature: PremiumFeature;
  children: ReactNode;
}

const PremiumRoute = ({ feature, children }: PremiumRouteProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [tier, setTier] = useState<PremiumTier>("Free");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTier = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      try {
        const premiumSelection = await getPremiumSelection(session.user.id);
        const selectedTier = premiumSelection?.selected_tier;
        setTier(selectedTier === "Plus" || selectedTier === "Pro" ? selectedTier : "Free");
      } catch {
        setTier("Free");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTier();

    return () => {
      isMounted = false;
    };
  }, [feature]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isFeatureAvailable(tier, feature)) {
    return <>{children}</>;
  }

  const config = featureGateConfig[feature];

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center">
        <Card className="w-full border-border/60 shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl">{config.label} is locked</CardTitle>
                <CardDescription className="mt-1">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                Current plan: {getTierLabel(tier)}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Requires {config.requiredTier}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upgrade to unlock this workspace or keep using the free finance tools.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="gap-2">
                <Link to="/premium">
                  <Crown className="h-4 w-4" />
                  View plans
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/dashboard">
                  <Sparkles className="h-4 w-4" />
                  Back to dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumRoute;
