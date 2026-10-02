import { expect, test } from "@playwright/test";
test("simplified workspace shows email metrics and hides retired sections", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Sample data · read-only")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Email dashboard" })).toBeVisible();
  await expect(page.getByText("Emails sent", { exact: true })).toBeVisible();
  await expect(page.getByText("Opens detected", { exact: true })).toBeVisible();
  await expect(page.getByText("Replies received", { exact: true })).toBeVisible();
  await expect(page.getByText("Disconnected", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Applications", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Tasks", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Daily target")).toBeDisabled();
  await expect(page.getByLabel("Monthly target")).toBeDisabled();
  await page.getByRole("link", { name: "My CVs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My CVs", exact: true })).toBeVisible();
});
test("attachments show filenames and can be removed and added again", async ({ page }) => {
  await page.goto("/email/compose");
  const attachment = { name: "resume.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") };
  await page.getByLabel("Add attachments").setInputFiles(attachment);
  await expect(page.getByText("resume.pdf", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove resume.pdf", exact: true }).click();
  await expect(page.getByText("resume.pdf", { exact: true })).toHaveCount(0);
  await page.getByLabel("Add attachments").setInputFiles(attachment);
  await expect(page.getByText("resume.pdf", { exact: true })).toBeVisible();
});
test("legacy section URLs return to the email dashboard", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/applications");
  await expect(page).toHaveURL(/\/dashboard$/);
});
