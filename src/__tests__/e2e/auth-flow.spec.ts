import { test, expect } from '@playwright/test';

test.describe('Auth Flow & Redirection', () => {
  test.beforeEach(async ({ page }) => {
    // Basic Supabase Mocking
    await page.route(url => url.host === 'localhost:54321', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/token')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-token',
            user: { id: 'mock-user', email: 'test@example.com' }
          }),
        });
      }
      return route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
  });

  test('should redirect unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect unauthenticated user from /invite to /login', async ({ page }) => {
    await page.goto('/invite?token=test-token');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Bug 1.9: should persist token and redirect to /invite after login', async ({ page }) => {
    // 1. Visit invite page unauthenticated (saves token)
    await page.goto('/invite?token=bug-1-9-token');
    await expect(page).toHaveURL(/.*login/);

    // 2. Perform login
    await page.fill('input[name="email"]', 'platformadmin@capegis.test');
    await page.fill('input[name="password"]', 'any-password');
    await page.click('button[type="submit"]');

    // 3. Should redirect to /invite instead of /dashboard
    await expect(page).toHaveURL(/.*invite\?token=bug-1-9-token/);
  });
});
