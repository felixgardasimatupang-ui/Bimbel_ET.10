import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /EduAdmin Bimbel/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('logs in with demo credentials and sees dashboard', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@bimbel.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#panel_ringkasan')).toBeVisible({ timeout: 10000 });
  });

  test('can navigate between panels after login', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@bimbel.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 10000 });

    await page.click('#nav_siswa');
    await expect(page.locator('#panel_siswa')).toBeVisible({ timeout: 5000 });

    await page.click('#nav_modul');
    await expect(page.locator('#panel_modul')).toBeVisible({ timeout: 5000 });
  });

  test('logout button clears session', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@bimbel.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 10000 });

    await page.click('button[aria-label="Logout"]');
    await expect(page.getByRole('heading', { name: /EduAdmin Bimbel/i })).toBeVisible({ timeout: 5000 });
  });
});
