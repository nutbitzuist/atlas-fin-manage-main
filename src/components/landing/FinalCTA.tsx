import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { billingConfig } from "@/config/billing";

export const FinalCTA = () => {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-blue-700" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Take Control of Your Finances?
          </h2>

          <p className="text-xl text-green-100 mb-8 leading-relaxed">
            Join thousands of Thai users who are achieving their financial goals with FinDash OS
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">No commitment until checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Plan terms shown before purchase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Cancel anytime</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-green-50 shadow-xl hover:shadow-2xl transition-all text-lg px-10 py-6 h-auto"
              onClick={() => {
                const target = billingConfig.checkoutUrlPro || billingConfig.checkoutUrlPlus;
                window.location.href = target || "/login";
              }}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <p className="mt-6 text-sm text-green-100">
            Setup takes less than 2 minutes
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl" />
    </section>
  );
};
