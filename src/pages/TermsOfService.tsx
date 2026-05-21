import SEO from "@/components/SEO";

const sections = [
  {
    title: "Using the service",
    body: "You agree to use FinDash OS only for lawful purposes and to provide accurate information when entering financial data.",
  },
  {
    title: "Accounts and access",
    body: "You are responsible for maintaining the security of your account and for any activity that occurs under your login.",
  },
  {
    title: "Plans and billing",
    body: "Plan details, billing terms, trial periods, and cancellation terms are disclosed in your checkout flow and billing portal.",
  },
  {
    title: "No financial advice",
    body: "The app provides planning tools and estimates. It does not replace professional financial, tax, legal, or investment advice.",
  },
];

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Terms of Service"
        description="Terms of service for FinDash OS covering account use, billing, and disclaimer terms."
        canonical="/terms"
      />
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">
          These terms govern your use of FinDash OS and its paid plans, including subscription management, billing timing, and cancellation rights.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="rounded-xl border bg-card p-6">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-muted-foreground leading-7">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
