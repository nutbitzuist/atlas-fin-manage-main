import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", text: "FinDash OS" },
  { path: "/login", text: "FinDash OS" },
  { path: "/calculators", text: "Personal Finance Calculator Library" },
  { path: "/guides", text: "Finance Comparison Guides" },
  { path: "/use-cases", text: "Local Finance Planning Templates" },
  { path: "/templates", text: "Finance Template Library" },
  { path: "/learn", text: "Finance Education Hub" },
];

test.describe("public routes", () => {
  for (const route of publicRoutes) {
    test(`${route.path} renders expected content`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByText(route.text).first()).toBeVisible();
    });
  }
});

test("protected dashboard redirects anonymous users to login", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=");
      if (!name) return;
      document.cookie = `${name}=; Max-Age=0; path=/`;
    });
  });
  await page.context().clearCookies();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("FinDash OS")).toBeVisible();
});
