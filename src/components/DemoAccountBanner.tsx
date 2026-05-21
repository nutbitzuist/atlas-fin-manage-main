import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Session } from "@supabase/supabase-js";

interface DemoAccountBannerProps {
  session: Session | null;
}

/**
 * DemoAccountBanner component
 *
 * Displays a banner when the logged-in user is the demo account.
 * This helps visitors understand they're viewing sample data.
 *
 * Usage:
 * Import this component in your Layout.tsx or Index.tsx and pass the session:
 * <DemoAccountBanner session={session} />
 */
export const DemoAccountBanner = ({ session }: DemoAccountBannerProps) => {
  // Check if the current user is the demo account
  const isDemoAccount = session?.user?.email === 'demo@atlasfinance.com';

  // Don't render anything if not demo account
  if (!isDemoAccount) return null;

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-blue-900 font-semibold">
        Demo Account - Sample Data
      </AlertTitle>
      <AlertDescription className="text-blue-700">
        You're viewing a demonstration account with fictional data. This showcases
        all the features of Atlas Finance Management.
        <a
          href="/login"
          className="underline font-medium ml-1 hover:text-blue-900"
        >
          Sign up to create your own account
        </a>
        {" "}and start managing your real finances!
      </AlertDescription>
    </Alert>
  );
};
