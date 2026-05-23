import { test, expect } from '@playwright/test';

test.describe('PDFMinty Home Page', () => {
  test('has correct title and heading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PDFMinty/);
    await expect(page.locator('h1')).toContainText(/PDF Tools/i);
  });

  test('displays all 15 tools', async ({ page }) => {
    await page.goto('/');
    const tools = page.locator('.tool-card');
    await expect(tools).toHaveCount(15);
  });

  test('privacy banner is visible', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('.privacy-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('never leave');
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
  });

  test('navigation to tool page works', async ({ page }) => {
    await page.goto('/');
    const mergeCard = page.locator('.tool-card:has-text("Merge PDF")').first();
    await mergeCard.click();
    await expect(page).toHaveURL(/merge-pdf/);
    await expect(page.locator('h1')).toContainText('Merge PDF');
  });

  test('search filters tools', async ({ page }) => {
    await page.goto('/');
    const search = page.locator('#tool-search');
    await search.fill('merge');
    const tools = page.locator('.tool-card');
    await expect(tools).toHaveCount(1);
  });

  test('category tabs filter tools', async ({ page }) => {
    await page.goto('/');
    const convertTab = page.locator('.category-tab[data-cat="convert"]');
    await convertTab.click();
    const visibleCards = page.locator('.tool-card:visible');
    await expect(visibleCards).toHaveCount(2);
  });

  test('FAQ accordion works', async ({ page }) => {
    await page.goto('/');
    const question = page.locator('.faq-question').first();
    await question.click();
    await expect(question).toHaveAttribute('aria-expanded', 'true');
  });
});
