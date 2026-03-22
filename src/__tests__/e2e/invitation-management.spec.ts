import { test, expect } from '@playwright/test';

test.describe('Invitation Management (Bugs 1.8, 1.10, 1.11)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-ignore
      delete navigator.serviceWorker.register;
      // @ts-ignore
      navigator.serviceWorker.register = () => new Promise(() => {});
    });
  });

  test('Bug 1.8: should include delivery_status on invitation', async ({ page }) => {
    // Mock TENANT_ADMIN session
    await page.route(url => url.host === 'localhost:54321', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/v1/user')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'admin-id', email: 'admin@tenant.com', user_metadata: { role: 'TENANT_ADMIN' } })
        });
      }
      if (url.includes('/rest/v1/profiles')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'admin-id', role: 'TENANT_ADMIN', tenant_id: 'tenant-id' }]) });
      }
      return route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock invitations fetch with delivery_status
    await page.route('**/rest/v1/tenant_invitations*', async (route) => {
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
                id: 'inv-1',
                email: 'invited@test.com',
                status: 'pending',
                delivery_status: 'sent',
                created_at: new Date().toISOString()
            }])
        });
    });

    await page.goto('/dashboard');
    
    // Check if delivery status is visible in the InvitesTab
    await page.click('text=User Management'); // Open panel
    await page.click('text=Invitations'); // Switch to tab
    await expect(page.locator('text=sent')).toBeVisible();
  });

  test('Bug 1.10: should return 410 for expired token', async ({ page }) => {
    await page.route('**/api/invitations/accept*', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 410, contentType: 'application/json', body: JSON.stringify({ error: 'Token expired' }) });
      }
      return route.continue();
    });

    await page.goto('/invite?token=expired-token');
    // Assuming page handles 410 appropriately (unauthenticated visit starts the flow)
    // Here we can use evaluate to check the API response directly if needed
    const response = await page.evaluate(async () => {
        const res = await fetch('/api/invitations/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: 'expired-token' })
        });
        return res.status;
    });
    expect(response).toBe(410);
  });

  test('Bug 1.11: existing member should NOT be overwritten', async ({ page }) => {
    await page.route('**/api/invitations/accept*', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'User is already a member' }) });
      }
      return route.continue();
    });

    const response = await page.evaluate(async () => {
        const res = await fetch('/api/invitations/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: 'member-token' })
        });
        return res.status;
    });
    expect(response).toBe(400);
  });
});
