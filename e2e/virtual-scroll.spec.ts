import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

test.describe('Virtual Scrolling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('SiswaPanel virtualizer unmounts offscreen rows and renders new ones on scroll', async ({ page }) => {
    await navigateTo(page, 'siswa', 'siswa');

    const container = page.locator('[data-testid="virtual-scroll-container"]');
    await expect(container).toBeVisible();

    const firstRow = page.locator('[data-index="0"]');
    await expect(firstRow).toBeVisible();

    await container.evaluate((el) => el.scrollBy(0, 2000));
    await page.waitForTimeout(300);

    await expect(firstRow).not.toBeVisible();

    const laterRow = page.locator('[data-index="10"]');
    await expect(laterRow).toBeVisible();
  });

  test('AuditLogPanel virtualizer renders and scrolls correctly', async ({ page }) => {
    await navigateTo(page, 'audit', 'audit');

    const container = page.locator('[data-testid="virtual-scroll-container"]');
    await expect(container).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('[data-index="0"]');
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    await container.evaluate((el) => el.scrollBy(0, 1500));
    await page.waitForTimeout(300);

    await expect(firstRow).not.toBeVisible();
  });
});
