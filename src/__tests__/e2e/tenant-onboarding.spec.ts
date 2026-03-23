import { test, expect } from '@playwright/test';

test.describe('Tenant Onboarding Flow (Bug 1.7)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Disable Service Worker
    await page.addInitScript(() => {
      // @ts-ignore
      delete navigator.serviceWorker.register;
      // @ts-ignore
      navigator.serviceWorker.register = () => new Promise(() => {});
    });

    // 2. Mock Supabase for Platform Admin
    await page.route(url => url.host === 'localhost:54321', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/user')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-admin-id',
            email: 'platformadmin@capegis.test',
            user_metadata: { role: 'PLATFORM_ADMIN' }
          }),
        });
      }
      if (url.includes('/rest/v1/profiles')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'mock-admin-id', role: 'PLATFORM_ADMIN' }]),
        });
      }
      return route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
  });

  test('should allow creating a new tenant (organization)', async ({ page }) => {
    // Mock successful tenant creation (POST /rest/v1/tenants)
    await page.route('**/rest/v1/tenants*', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'new-tenant-id', name: 'New Org', slug: 'new-org' })
        });
      }
      return route.continue();
    });

    await page.goto('/dashboard');
    
    // Check if "Create Organization" button/modal is visible (Role Gate check)
    await page.waitForSelector('text=Create Organization', { timeout: 10000 });
    await page.click('text=Create Organization');
    
    await page.fill('input[placeholder="Organization Name"]', 'New Org');
    await page.click('button:has-text("Create")');
    
    // Verify success toast or redirect
    await expect(page.locator('text=Organization created successfully')).toBeVisible();
  });
});
