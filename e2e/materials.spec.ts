import { test, expect } from '@playwright/test';

test.describe('Materials', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@bimbel.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 10000 });
  });

  test('shows materials panel', async ({ page }) => {
    await page.click('#nav_modul');
    await expect(page.locator('#panel_modul')).toBeVisible({ timeout: 5000 });
  });
});