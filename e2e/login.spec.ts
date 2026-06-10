import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('displays login page when not authenticated', async ({ page }) => {
    await expect(page.getByText('EduAdmin Bimbel')).toBeVisible();
    await expect(page.getByText('Sistem Manajemen Bimbel Terpadu')).toBeVisible();
    await expect(page.getByPlaceholder('admin@bimbel.edu')).toBeVisible();
    await expect(page.getByPlaceholder('Masukkan password')).toBeVisible();
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.getByPlaceholder('admin@bimbel.edu').fill('wrong@email.com');
    await page.getByPlaceholder('Masukkan password').fill('wrongpass');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByText(/Email atau password salah/)).toBeVisible();
  });

  test('successfully logs in with demo credentials', async ({ page }) => {
    await page.getByPlaceholder('admin@bimbel.edu').fill('admin@bimbel.edu');
    await page.getByPlaceholder('Masukkan password').fill('admin123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByText('Ringkasan Performa')).toBeVisible({ timeout: 10000 });
  });
});
