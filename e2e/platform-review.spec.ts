import { test, expect } from '@playwright/test';

test('platform admin reviews and approves a submitted application', async ({ page }) => {
  test.skip(!process.env.E2E_PLATFORM_EMAIL || !process.env.E2E_PLATFORM_PASSWORD, 'Set E2E_PLATFORM_EMAIL and E2E_PLATFORM_PASSWORD for the platform flow.');

  await page.goto('/login?next=/platform/applications');
  await page.getByLabel('School email').fill(process.env.E2E_PLATFORM_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_PLATFORM_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/platform\/applications/);

  await page.locator('main ul a').first().click();
  await page.getByRole('button', { name: 'Mark under review' }).click();
  await page.getByRole('button', { name: 'Approve and provision school' }).click();
  await expect(page.getByText('APPROVED')).toBeVisible();
});
