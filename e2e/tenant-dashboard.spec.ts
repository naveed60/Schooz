import { test, expect } from '@playwright/test';

test('approved school owner can enter the tenant dashboard', async ({ page }) => {
  test.skip(!process.env.E2E_OWNER_EMAIL || !process.env.E2E_OWNER_PASSWORD || !process.env.E2E_SCHOOL_SLUG, 'Set E2E_OWNER_EMAIL, E2E_OWNER_PASSWORD and E2E_SCHOOL_SLUG for the tenant flow.');
  const slug = process.env.E2E_SCHOOL_SLUG!;
  await page.goto(`/login?next=/s/${slug}/dashboard`);
  await page.getByLabel('School email').fill(process.env.E2E_OWNER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_OWNER_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(new RegExp(`/s/${slug}/dashboard`));
  await expect(page.getByText('School dashboard')).toBeVisible();
});
