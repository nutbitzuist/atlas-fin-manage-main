import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, TrendingUp, Shield, PieChart } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Hero = () => {
  const { t } = useTranslation('landing');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              {t('hero.titleStart')}{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>

            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <p className="mt-4 text-base text-gray-500 leading-relaxed">
              {t('hero.description')}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all text-base px-8">
                <Link to="/login">
                  {t('hero.cta')}
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-2 border-green-600 text-green-600 hover:bg-green-50 text-base px-8">
                <Play className="mr-2 h-5 w-5" />
                {t('hero.secondaryCta')}
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>{t('hero.security')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{t('hero.trial')}</span>
                {t('hero.trialText') && <span>{t('hero.trialText')}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span>{t('hero.noCard')}</span>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            {/* Floating cards */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
              {/* Mini dashboard preview */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{t('hero.financialOverview')}</h3>
                  <span className="text-xs text-gray-500">{t('hero.thisMonth')}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-medium">{t('hero.netWorth')}</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">฿2.4M</p>
                    <p className="text-xs text-green-600 mt-1">+12.5% {t('hero.thisMonth').toLowerCase()}</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <PieChart className="h-4 w-4" />
                      <span className="text-xs font-medium">{t('hero.investments')}</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">฿850K</p>
                    <p className="text-xs text-blue-600 mt-1">+8.3% return</p>
                  </div>
                </div>

                {/* Chart placeholder */}
                <div className="bg-gray-50 rounded-xl p-4 h-32 flex items-end gap-1">
                  {[40, 65, 45, 80, 60, 90, 75, 95, 70, 85, 100, 90].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Bottom stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-gray-500">{t('hero.income')}</p>
                    <p className="font-semibold text-gray-900">฿120K</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('hero.expenses')}</p>
                    <p className="font-semibold text-gray-900">฿45K</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('hero.savings')}</p>
                    <p className="font-semibold text-green-600">฿75K</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-white rounded-full shadow-lg px-4 py-2 border-2 border-green-500">
              <p className="text-xs font-semibold text-green-600">{t('hero.thaiTaxOptimized')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
