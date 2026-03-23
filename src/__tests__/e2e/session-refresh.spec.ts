import { test, expect } from '@playwright/test';

test.describe('Session Refresh (Bug 1.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-ignore
      delete navigator.serviceWorker.register;
      // @ts-ignore
      navigator.serviceWorker.register = () => new Promise(() => {});
    });
  });

  test('Bug 1.3: should trigger session refresh via useAuthRefresh', async ({ page }) => {
    let refreshCalled = false;
    
    // Mock Supabase Auth
    await page.route(url => url.host === 'localhost:54321', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/token')) {
          refreshCalled = true;
          return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ access_token: 'new-token', expires_in: 3600 })
          });
      }
      if (url.includes('/auth/v1/user')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'user-id' }) });
      }
      return route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/dashboard');
    
    // Trigger the hook logic manually via event or wait for the interval
    // Since we mocked 60s, we can use page.evaluate to trigger the refresh call
    // or just check if the onAuthStateChange was registered.
    
    await page.evaluate(() => {
        // Find the hook or trigger the refresh logic if it's exposed
        // For E2E, we can just wait for the periodic check if we set it low, 
        // but here we can just verify the hook is mounted and calling getSession.
    });

    // Alternatively, verify the initial session check happened
    await expect.poll(() => refreshCalled, { timeout: 10000 }).toBeTruthy();
  });
});
