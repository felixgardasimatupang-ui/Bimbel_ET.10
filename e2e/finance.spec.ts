import { test, expect } from '@playwright/test';

test.describe('Finance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@bimbel.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 10000 });
  });

  test('shows finance panel with transaction list', async ({ page }) => {
    await page.click('#nav_spp');
    await expect(page.locator('#panel_spp')).toBeVisible({ timeout: 5000 });
  });

  test('navigation works correctly from finance back to dashboard', async ({ page }) => {
    await page.click('#nav_spp');
    await expect(page.locator('#panel_spp')).toBeVisible({ timeout: 5000 });
    await page.click('#nav_ringkasan');
    await expect(page.locator('#panel_ringkasan')).toBeVisible({ timeout: 5000 });
  });
});