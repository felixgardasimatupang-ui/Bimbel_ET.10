import { test, expect } from '@playwright/test';

test.describe('Student CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@bimbel.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 10000 });
  });

  test('shows students panel', async ({ page }) => {
    await page.click('#nav_siswa');
    await expect(page.locator('#panel_siswa')).toBeVisible({ timeout: 5000 });
  });

  test('has search input in students panel', async ({ page }) => {
    await page.click('#nav_siswa');
    await expect(page.locator('#panel_siswa')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[placeholder*="Cari" i]')).toBeVisible();
  });
});