import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is my financial data secure?",
    answer: "The app is designed around manual-first finance tracking. We avoid asking for bank credentials, keep access tied to your account, and use standard platform security controls for data handling.",
  },
  {
    question: "Can I connect my Thai bank accounts?",
    answer: "The current product is manual-first. You can track finances by entering data directly and import CSV files when available. Bank integrations can be added later without changing the core workflow.",
  },
  {
    question: "How does the Thai tax planning work?",
    answer: "The tax planning tools are built around Thai planning concepts such as RMF, SSF, insurance deductions, and other common categories. They provide estimates and planning guidance, not tax advice.",
  },
  {
    question: "What is Household Mode?",
    answer: "Household Mode is the Plus-tier workspace for shared money management. It enables shared budgets, shared goals, shared billing tracking, and household reports while keeping each person’s personal accounts private.",
  },
  {
    question: "What does Pro unlock?",
    answer: "Pro includes Plus-level features and unlocks the AI Finance Coach (guided prompts, tax and cash flow insights) plus the Growth Dashboard for analytics, growth metrics, and activation telemetry.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. Cancel and plan changes are managed in the customer portal; route access follows entitlement updates from webhook sync.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "Payment methods depend on your configured checkout provider. Add cards, bank transfers, or other methods there and launch with the checkout URL env variables.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Refunds, trial eligibility, and cancellation timing are managed in checkout and reflected in the payment portal at any time for active subscribers.",
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about FinDash OS
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-green-600 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a
            href="mailto:support@findashos.com"
            className="text-green-600 hover:text-green-700 font-semibold hover:underline"
          >
            Contact our support team →
          </a>
        </div>
      </div>
    </section>
  );
};
