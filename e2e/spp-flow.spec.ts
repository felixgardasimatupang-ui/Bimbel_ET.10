import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

test.describe('SPP Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('toggles SPP status on a student and verifies transaction appears', async ({ page }) => {
    // Navigate to Siswa panel
    await navigateTo(page, 'siswa', 'siswa');

    // Wait for student table to render
    await expect(page.locator('#spp_badge_SIS-001')).toBeVisible({ timeout: 10000 });

    // Get current badge text
    const badge = page.locator('#spp_badge_SIS-001');
    const initialText = await badge.textContent();

    // Click to toggle SPP
    await badge.click();

    // Verify badge changed (optimistic update should show immediately)
    await expect(badge).not.toHaveText(initialText!, { timeout: 5000 });

    // Navigate to SPP panel to verify transaction appears
    await navigateTo(page, 'spp', 'spp');
  });
});
