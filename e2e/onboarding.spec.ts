import { test, expect } from '@playwright/test';

test('authenticated applicant can create, upload and submit an application', async ({ page }) => {
  test.skip(!process.env.E2E_ONBOARDING_EMAIL || !process.env.E2E_ONBOARDING_PASSWORD, 'Set E2E_ONBOARDING_EMAIL and E2E_ONBOARDING_PASSWORD for the authenticated flow.');

  await page.goto('/login?next=/onboarding');
  await page.getByLabel('School email').fill(process.env.E2E_ONBOARDING_EMAIL!);
  await page.getByLabel('Password').fill(process.env.E2E_ONBOARDING_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByPlaceholder('School name').fill('E2E North Star School');
  await page.getByPlaceholder('School type').fill('PRIVATE');
  await page.getByPlaceholder('School email').fill('e2e-school@example.com');
  await page.getByPlaceholder('Phone').fill('+923001234567');
  await page.getByPlaceholder('Address line 1').fill('1 Main Street');
  await page.getByPlaceholder('City').fill('Lahore');
  await page.getByPlaceholder('State or region').fill('Punjab');
  await page.getByPlaceholder('Country code, e.g. PK').fill('PK');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page).toHaveURL(/\/onboarding\/[0-9a-f-]+/);

  await page.getByPlaceholder('Document type').fill('REGISTRATION');
  await page.locator('input[type="file"]').setInputFiles({ name: 'registration.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 e2e') });
  await page.getByRole('button', { name: 'Upload document' }).click();
  await page.getByRole('button', { name: 'Submit application' }).click();
  await expect(page.getByText('SUBMITTED')).toBeVisible();
});
