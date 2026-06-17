import { type Page, expect } from '@playwright/test';

export const DEMO_EMAIL = 'admin@bimbel.edu';
export const DEMO_PASSWORD = 'admin123';

export async function loginAsAdmin(page: Page) {
  await page.goto('/');
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page.locator('#sidebar')).toBeVisible({ timeout: 10000 });
}

export async function navigateTo(page: Page, tabId: string, panelId: string) {
  await page.click(`#nav_${tabId}`);
  await expect(page.locator(`#panel_${panelId}`)).toBeVisible({ timeout: 5000 });
}
