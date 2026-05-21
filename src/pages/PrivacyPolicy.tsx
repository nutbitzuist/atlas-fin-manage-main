import SEO from "@/components/SEO";

const sections = [
  {
    title: "What we collect",
    body: "We collect the account and finance data you choose to enter into the app, along with basic account and usage data needed to run the service.",
  },
  {
    title: "How we use it",
    body: "We use your data to show dashboards, forecasts, reports, reminders, and the workflows you enable. We do not require bank credentials for core use.",
  },
  {
    title: "Sharing",
    body: "We do not sell personal finance data. We only share data with service providers required to operate the product, such as hosting, authentication, and analytics tools you enable.",
  },
  {
    title: "Your controls",
    body: "You can export data, submit data-deletion requests, and adjust notification preferences in the app. Billing is controlled in checkout and your payment portal.",
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy"
        description="Privacy policy for FinDash OS describing data collection, use, sharing, and user controls."
        canonical="/privacy"
      />
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">
          This policy describes how FinDash OS handles personal finance data, including how we protect, retain, and share account data.
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
