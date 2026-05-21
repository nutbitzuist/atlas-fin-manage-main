import { useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation('landing');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              FinDash OS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" asChild className="text-gray-600 hover:text-green-600">
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-green-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="flex flex-col gap-2 pt-4">
                <div className="flex justify-center pb-2">
                  <LanguageSwitcher />
                </div>
                <Button variant="ghost" asChild className="w-full justify-center">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild className="w-full justify-center bg-green-600 hover:bg-green-700">
                  <Link to="/login">Get Started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
