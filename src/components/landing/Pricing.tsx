import { useState } from "react";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { billingConfig } from "@/config/billing";

export const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      targetTier: "Free" as const,
      description: "Perfect for getting started",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "Up to 20 transactions/month",
        "Basic expense tracking",
        "Simple budgets",
        "Mobile app access",
      ],
      cta: "Get Started",
      popular: false,
      color: "border-gray-200",
    },
    {
      name: "Pro",
      targetTier: "Plus" as const,
      description: "For serious money managers",
      monthlyPrice: 299,
      annualPrice: 2990, // 299 * 10 = 2 months free
      features: [
        "Unlimited transactions",
        "Thai tax planning & optimization",
        "Advanced reports & analytics",
        "Unlimited accounts",
        "Investment tracking",
        "Bill management",
        "Emergency fund planning",
        "Priority email support",
      ],
      cta: "Upgrade",
      popular: true,
      color: "border-green-500",
    },
    {
      name: "Premium",
      targetTier: "Pro" as const,
      description: "For financial success",
      monthlyPrice: 599,
      annualPrice: 5990, // 599 * 10 = 2 months free
      features: [
        "Everything in Pro",
        "Financial planning education",
        "Investment education",
        "Trading education",
        "Tax optimization strategies",
        "Dedicated support",
        "Early access to new features",
      ],
      cta: "Upgrade",
      popular: false,
      color: "border-blue-500",
    },
  ];

  const formatPrice = (monthlyPrice: number, annualPrice: number) => {
    if (monthlyPrice === 0) return "฿0";

    if (isAnnual) {
      const monthlyEquivalent = Math.floor(annualPrice / 12);
      return `฿${monthlyEquivalent.toLocaleString()}`;
    }

    return `฿${monthlyPrice.toLocaleString()}`;
  };

  const getAnnualSavings = (monthlyPrice: number, annualPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const yearlyFromMonthly = monthlyPrice * 12;
    return yearlyFromMonthly - annualPrice;
  };

  const handlePlanClick = (tier: "Free" | "Plus" | "Pro") => {
    const url =
      tier === "Plus"
        ? billingConfig.checkoutUrlPlus
        : tier === "Pro"
          ? billingConfig.checkoutUrlPro
          : null;

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.href = "/login";
  };

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Plan
            </span>
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start free, upgrade when you're ready
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Save 2 months!
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white border-2 ${plan.color} rounded-2xl p-8 ${
                plan.popular ? 'shadow-2xl scale-105 md:scale-110 z-10' : 'shadow-lg'
              } hover:shadow-xl transition-all`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                  <Star className="h-4 w-4 fill-current" />
                  MOST POPULAR
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.monthlyPrice, plan.annualPrice)}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>

                {/* Annual savings */}
                {isAnnual && plan.monthlyPrice > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    Save ฿{getAnnualSavings(plan.monthlyPrice, plan.annualPrice).toLocaleString()}/year
                  </p>
                )}
                {isAnnual && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Billed ฿{plan.annualPrice.toLocaleString()} annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 ${plan.popular ? 'text-green-600' : 'text-gray-400'} flex-shrink-0 mt-0.5`} />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={`w-full ${
                  plan.popular
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                    : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300'
                }`}
                size="lg"
                onClick={() => handlePlanClick(plan.targetTier)}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="text-center text-sm text-gray-600 mt-12">
          Checkout is configured using environment variables. Plan terms are shown in your checkout provider flow.
        </p>
      </div>
    </section>
  );
};
