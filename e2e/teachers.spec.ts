import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

test.describe('Teachers', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows teacher panel', async ({ page }) => {
    await navigateTo(page, 'pengajar', 'pengajar');
  });

  test('shows teacher list', async ({ page }) => {
    await navigateTo(page, 'pengajar', 'pengajar');
    await expect(page.locator('table')).toBeVisible();
  });
});
