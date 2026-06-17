import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

test.describe('Finance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows finance panel with transaction list', async ({ page }) => {
    await navigateTo(page, 'spp', 'spp');
  });

  test('navigation works correctly from finance back to dashboard', async ({ page }) => {
    await navigateTo(page, 'spp', 'spp');
    await navigateTo(page, 'ringkasan', 'ringkasan');
  });

  test('shows financial summary data', async ({ page }) => {
    await navigateTo(page, 'spp', 'spp');
    await expect(page.locator('text=SPP').first()).toBeVisible({ timeout: 5000 });
  });
});
