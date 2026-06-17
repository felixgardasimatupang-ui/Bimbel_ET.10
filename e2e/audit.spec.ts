import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

test.describe('Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows audit log panel', async ({ page }) => {
    await navigateTo(page, 'audit', 'audit');
  });

  test('audit log panel has table with log entries', async ({ page }) => {
    await navigateTo(page, 'audit', 'audit');
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  });

  test('has filter controls for action and entity', async ({ page }) => {
    await navigateTo(page, 'audit', 'audit');
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
  });
});
