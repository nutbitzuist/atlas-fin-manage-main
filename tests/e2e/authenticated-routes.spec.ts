import { expect, test, type Page } from "@playwright/test";

type AuthCredentials = {
  email: string;
  password: string;
};

const getAuthCredentials = (): AuthCredentials | null => {
  const email = process.env.E2E_EMAIL?.trim();
  const password = process.env.E2E_PASSWORD?.trim();

  if (!email || !password) {
    return null;
  }

  return { email, password };
};

const signInWithEmailPassword = async (page: Page): Promise<void> => {
  const credentials = getAuthCredentials();

  if (!credentials) {
    test.skip("Set E2E_EMAIL and E2E_PASSWORD environment variables to run authenticated tests.");
    return;
  }

  const { email, password } = credentials;

  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  const isSignInView = await page
    .getByRole("button", { name: /^Sign In$/i })
    .waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!isSignInView) {
    await expect(page).toHaveURL(/\/dashboard$/);
    return;
  }

  await page.fill("#signin-email", email);
  await page.fill("#signin-password", password);
  await page.getByRole("button", { name: /^Sign In$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
};

test.describe("authenticated routes", () => {
  test("dashboard route renders core shell after login", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: /Dashboard|แดชบอร์ด/i })).toBeVisible();
    await expect(page.getByText(/Welcome back|Welcome Back|ยินดีต้อนรับ/i)).toBeVisible();
  });

  test("budget route renders planning page shell", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/budget");

    await expect(page.getByRole("heading", { name: /^Budget$/i })).toBeVisible();
    await expect(page.getByText(/Plan and track your monthly budget/i)).toBeVisible();
  });

  test("bills page can switch to calendar mode", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/bills");

    await expect(page.getByRole("heading", { name: /^Bills & Subscriptions$/ })).toBeVisible();
    await page.getByRole("button", { name: /^Calendar$/i }).click();
    await expect(page.getByRole("heading", { name: /Upcoming Bills \(Next 30 Days\)/i })).toBeVisible();
    const noUpcoming = page.getByText("No upcoming bills in the next 30 days");
    const dayHeader = page.getByText(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s[A-Za-z]{3}\s\d{1,2}\b/i).first();
    await expect(noUpcoming.or(dayHeader)).toBeVisible();
  });

  test("budget page can open add category dialog and validate required fields", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/budget");

    await expect(page.getByRole("heading", { name: /^Budget$/i })).toBeVisible();

    const addYourFirstCategory = page.getByRole("button", { name: /add your first category/i });
    const addCategory = page.getByRole("button", { name: /^add category$/i });

    if (await addYourFirstCategory.isVisible().catch(() => false)) {
      await addYourFirstCategory.click();
    } else {
      await addCategory.first().click();
    }

    await expect(page.getByRole("heading", { name: /add budget category/i })).toBeVisible();
    await page.getByRole("button", { name: /create budget/i }).click();
    await expect(page.getByText("Please fill in all required fields")).toBeVisible();
  });

  test("reports page exports PDF and CSV", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/reports-analytics");

    await expect(page.getByRole("heading", { name: /Reports & Analytics/i })).toBeVisible();

    const pdfDownload = page.waitForEvent("download", { timeout: 15000 });
    await page.getByRole("button", { name: "Download PDF" }).click();
    const pdfFile = await pdfDownload;
    await expect(await pdfFile.suggestedFilename()).toContain(".pdf");

    const csvDownload = page.waitForEvent("download", { timeout: 15000 });
    await page.getByRole("button", { name: "Export CSV" }).click();
    const csvFile = await csvDownload;
    await expect(await csvFile.suggestedFilename()).toMatch(/\.csv$/);
  });

  test("bills page supports list/calendar modes and filters", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/bills");

    await expect(page.getByRole("heading", { name: /^Bills & Subscriptions$/ })).toBeVisible();

    const listButton = page.getByRole("button", { name: /^List$/i });
    const calendarButton = page.getByRole("button", { name: /Calendar/i });
    await listButton.click();
    await expect(listButton).toBeEnabled();
    const listTableOrEmpty = page.getByRole("table").or(page.getByText(/No bills found/i));
    await expect(listTableOrEmpty).toBeVisible();

    await calendarButton.click();
    await expect(calendarButton).toBeEnabled();
    const calendarHeading = page.getByRole("heading", { name: /Upcoming Bills \(Next 30 Days\)/i });
    const calendarEmpty = page.getByText(/No upcoming bills in the next 30 days/i);
    await expect(calendarHeading.or(calendarEmpty)).toBeVisible();

    const recurringTab = page.getByRole("tab", { name: /^Recurring$/i });
    const oneTimeTab = page.getByRole("tab", { name: /^One-time$/i });
    const allTab = page.getByRole("tab", { name: /^All$/i });
    await allTab.click();
    await recurringTab.click();
    await expect(recurringTab).toHaveAttribute("data-state", "active");
    await oneTimeTab.click();
    await expect(oneTimeTab).toHaveAttribute("data-state", "active");
    await allTab.click();
    await expect(allTab).toHaveAttribute("data-state", "active");
  });

  test("budget page exposes smart budget workflow and setup controls", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/budget");

    await expect(page.getByRole("heading", { name: /^Budget$/i })).toBeVisible();
    await expect(page.getByText(/Smart Budget Builder/i)).toBeVisible();
    await expect(page.getByText(/Generate a smart budget to see recommended limits by category\./i)).toBeVisible();
    await expect(page.getByText(/^Budget Template$/)).toBeVisible();

    const addFirstCategoryButton = page.getByRole("button", { name: /add your first category/i });
    const addCategoryButton = page.getByRole("button", { name: /^add category$/i });
    if (await addFirstCategoryButton.isVisible().catch(() => false)) {
      await addFirstCategoryButton.click();
    } else {
      await addCategoryButton.first().click();
    }

    await expect(page.getByRole("heading", { name: /add budget category/i })).toBeVisible();
    await page.getByRole("button", { name: /^create budget$/i }).click();
    await expect(page.getByText("Please fill in all required fields")).toBeVisible();
    await page.getByRole("button", { name: /^cancel$/i }).click();
  });

  test("reports page supports report-type switching and export controls", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/reports-analytics");

    await expect(page.getByRole("heading", { name: /Reports & Analytics/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download PDF/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Export CSV/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Email Report/i })).toBeVisible();

    await page.getByRole("tab", { name: /^Quarterly$/i }).click();
    await expect(page.getByRole("heading", { name: /Q[1-4] \d{4} Financial Report/i })).toBeVisible();

    await page.getByRole("tab", { name: /^Annual$/i }).click();
    await expect(page.getByRole("heading", { name: /\d{4} Annual Financial Report/i })).toBeVisible();

    await page.getByRole("tab", { name: /^Analytics$/i }).click();
    await expect(page.getByText("Top Spending Categories")).toBeVisible();
  });

  test("dashboard CSV upload flow opens chooser and validates import", async ({ page }) => {
    await signInWithEmailPassword(page);
    await page.goto("/dashboard");

    const uploadButton = page.getByRole("button", { name: /Upload CSV/i });
    const chooserPromise = page.waitForEvent("filechooser");
    await uploadButton.click();
    const fileChooser = await chooserPromise;
    await fileChooser.setFiles({
      name: "invalid-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,amount,type,category\n2026-01-01,0,expense,Food\n", "utf-8"),
    });

    await expect(page.getByText("CSV import failed").first()).toBeVisible();
    await expect(page.getByText("Each row needs a non-zero amount.")).toBeVisible();
  });
});
