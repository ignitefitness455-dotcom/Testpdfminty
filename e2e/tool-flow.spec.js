import { test, expect } from '@playwright/test';

test.describe('Tool Flows', () => {
  test('merge tool page loads correctly', async ({ page }) => {
    await page.goto('/merge-pdf');
    await expect(page.locator('h1')).toContainText('Merge PDF');
    await expect(page.locator('text=Add More')).toBeVisible();
    await expect(page.locator('#drop-zone')).toBeVisible();
  });

  test('rotate tool has settings', async ({ page }) => {
    await page.goto('/rotate-pdf');
    await expect(page.locator('#rotate-angle')).toBeVisible();
  });

  test('protect tool has password strength indicator', async ({ page }) => {
    await page.goto('/protect-pdf');
    await expect(page.locator('#protect-password')).toBeVisible();
  });

  test('back button works', async ({ page }) => {
    await page.goto('/compress-pdf');
    await page.locator('.back-link').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('contact modal opens', async ({ page }) => {
    await page.goto('/');
    await page.locator('#footer-contact-btn').click();
    await expect(page.locator('#contact-modal-overlay')).toHaveClass(/active/);
  });
});
