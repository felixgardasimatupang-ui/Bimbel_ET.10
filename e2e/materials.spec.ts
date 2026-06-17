import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

test.describe('Materials', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows materials panel', async ({ page }) => {
    await navigateTo(page, 'modul', 'modul');
  });

  test('shows material list', async ({ page }) => {
    await navigateTo(page, 'modul', 'modul');
    await expect(page.locator('table')).toBeVisible();
  });

  test('has subject filter', async ({ page }) => {
    await navigateTo(page, 'modul', 'modul');
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
  });
});
