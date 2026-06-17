import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

test.describe('Student CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows students panel', async ({ page }) => {
    await navigateTo(page, 'siswa', 'siswa');
  });

  test('has search input in students panel', async ({ page }) => {
    await navigateTo(page, 'siswa', 'siswa');
    await expect(page.locator('input[placeholder*="Cari" i]')).toBeVisible();
  });

  test('shows student list', async ({ page }) => {
    await navigateTo(page, 'siswa', 'siswa');
    await expect(page.locator('table')).toBeVisible();
  });
});
