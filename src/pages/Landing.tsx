import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import SEO from "@/components/SEO";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Complete Personal Finance Management Dashboard"
        description="Comprehensive personal finance dashboard for tracking assets, investments, liabilities, income, expenses, budgets, and financial goals. Real-time net worth tracking, cash flow analysis, and financial health reports."
        keywords="personal finance, finance dashboard, budget tracker, expense tracker, net worth calculator, investment tracking, financial planning, wealth management, cash flow analysis, financial health"
        canonical="/"
      />
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
