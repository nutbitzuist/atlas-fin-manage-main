import { Link } from "react-router-dom";
import { Wallet, Facebook, Youtube, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FinDash OS</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Your complete financial operating system for Thailand
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm hover:text-green-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm hover:text-green-400 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm hover:text-green-400 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <Link to="/guides" className="text-sm hover:text-green-400 transition-colors">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/learn" className="text-sm hover:text-green-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-sm hover:text-green-400 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm hover:text-green-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm hover:text-green-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm hover:text-green-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@findashos.com"
                  className="text-sm hover:text-green-400 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2025 FinDash OS. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> for Thailand
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
