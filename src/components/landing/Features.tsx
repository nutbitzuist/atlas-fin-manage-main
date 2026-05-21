import { TrendingDown, Calculator, TrendingUp, PieChart, Shield, Calendar, FileText, Target } from "lucide-react";

const features = [
  {
    icon: TrendingDown,
    title: "Smart Expense Tracking",
    description: "Track every baht automatically with beautiful charts and insights. Multi-account support with budget alerts to keep you on track.",
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    icon: Calculator,
    title: "Thai Tax Planning",
    description: "Optimize RMF/LTF deductions, life & health insurance tracking, provident fund management, and real-time tax calculations.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    icon: TrendingUp,
    title: "Net Worth Dashboard",
    description: "Track all assets (cash, investments, real estate, vehicles), monitor liabilities, historical trends, and financial health score.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    icon: PieChart,
    title: "Investment Portfolio",
    description: "Track stocks, mutual funds, RMF, ESG with real-time valuations, dividend tracking, and asset allocation analysis.",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    icon: Shield,
    title: "Emergency Fund Builder",
    description: "Smart savings recommendations with progress tracking, goal-based planning, and automatic calculations for peace of mind.",
    color: "from-green-500 to-teal-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    icon: Calendar,
    title: "Bill Management",
    description: "Never miss a payment with recurring bill tracking, payment reminders, and comprehensive subscription management.",
    color: "from-orange-500 to-yellow-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    icon: FileText,
    title: "Financial Reports",
    description: "Generate monthly, quarterly, and annual reports. Income statements, CSV/PDF exports, and tax-ready summaries.",
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set and track savings goals, retirement planning, custom milestones with beautiful progress visualization.",
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Master Your Finances
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Powerful tools designed specifically for the Thai market
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group relative bg-white border ${feature.borderColor} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Icon */}
                <div className={`${feature.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: "transparent" }} />
                  <div className={`absolute h-6 w-6 bg-gradient-to-r ${feature.color} opacity-100`}>
                    <Icon className="h-6 w-6 text-white" style={{ mixBlendMode: "multiply" }} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
