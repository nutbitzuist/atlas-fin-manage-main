import { UserPlus, Database, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up with email or Google in just 1 minute. No credit card required for your free trial.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
  },
  {
    number: "02",
    icon: Database,
    title: "Connect Your Finances",
    description: "Add your accounts and assets, import transactions, and set your financial goals with our simple setup wizard.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Track & Optimize",
    description: "Monitor your finances in real-time, get actionable insights, and achieve your financial goals faster.",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Get Started in{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Minutes
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Three simple steps to take control of your financial future
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector line (hidden on mobile, shown on desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
                )}

                {/* Card */}
                <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow z-10">
                  {/* Number badge */}
                  <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>

                  {/* Icon */}
                  <div className={`${step.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                    <div className={`bg-gradient-to-br ${step.color} p-3 rounded-xl`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
