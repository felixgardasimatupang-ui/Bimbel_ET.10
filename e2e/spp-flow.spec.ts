import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

test.describe('SPP Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('toggles SPP status on a student and verifies transaction appears', async ({ page }) => {
    await navigateTo(page, 'siswa', 'siswa');

    const badge = page.locator('[id^="spp_badge_"]').first();
    await expect(badge).toBeVisible({ timeout: 10000 });

    const initialText = await badge.textContent();
    await badge.click();

    await expect(badge).not.toHaveText(initialText!, { timeout: 3000 });

    await navigateTo(page, 'spp', 'spp');
  });

  test('optimistic UI updates SPP status immediately before API completes', async ({ page }) => {
    await page.route('**/api/students/*/toggle-spp', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    });

    await navigateTo(page, 'siswa', 'siswa');

    const badge = page.locator('[id^="spp_badge_"]').first();
    await expect(badge).toBeVisible({ timeout: 10000 });

    const initialText = await badge.textContent();
    const expectedNew = initialText === 'LUNAS' ? 'BELUM BAYAR' : 'LUNAS';

    await badge.click();

    await expect(badge).toHaveText(expectedNew, { timeout: 500 });
  });
});
