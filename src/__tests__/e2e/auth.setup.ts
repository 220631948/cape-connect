import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authDir = path.join(__dirname, '../../../playwright/.auth');

const roles = [
  { name: 'platform-admin', email: 'platformadmin@capegis.test', envVar: 'SEED_PLATFORM_ADMIN_PW', role: 'PLATFORM_ADMIN' },
  { name: 'tenant-admin', email: 'tenantadmin@capegis.test', envVar: 'SEED_TENANT_ADMIN_PW', role: 'TENANT_ADMIN' },
  { name: 'viewer', email: 'viewer@capegis.test', envVar: 'SEED_VIEWER_PW', role: 'VIEWER' },
  { name: 'analyst', email: 'analyst@capegis.test', envVar: 'SEED_ANALYST_PW', role: 'ANALYST' },
  { name: 'guest', email: 'guest@capegis.test', envVar: 'SEED_GUEST_PW', role: 'GUEST' },
];

for (const role of roles) {
  setup(`authenticate as ${role.name}`, async ({ page }) => {
    setup.setTimeout(60000);

    // 1. Disable Service Worker to prevent network interception issues in tests
    await page.addInitScript(() => {
      // @ts-ignore
      delete navigator.serviceWorker.register;
      // @ts-ignore
      navigator.serviceWorker.register = () => new Promise(() => {});
    });

    // 2. Mock Supabase Network Traffic
    const patterns = [
        '**/localhost:54321/**',
        '**/127.0.0.1:54321/**',
        '**/[::1]:54321/**'
    ];

    for (const pattern of patterns) {
        await page.route(pattern, async (route) => {
            const url = route.request().url();
            const method = route.request().method();

            if (method === 'OPTIONS') {
                return route.fulfill({
                    status: 204,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-tenant-id'
                    }
                });
            }

            if (url.includes('/auth/v1/token')) {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        access_token: 'mock-token',
                        token_type: 'bearer',
                        expires_in: 3600,
                        refresh_token: 'mock-refresh-token',
                        user: {
                            id: 'mock-user-id',
                            email: role.email,
                            user_metadata: { role: role.role },
                        },
                    }),
                });
            }

            if (url.includes('/auth/v1/user')) {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'mock-user-id',
                        email: role.email,
                        user_metadata: { role: role.role },
                    }),
                });
            }

            if (url.includes('/rest/v1/profiles')) {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{
                        id: 'mock-user-id',
                        email: role.email,
                        role: role.role,
                        tenant_id: role.name.includes('tenant') ? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' : null,
                    }]),
                });
            }

            return route.fulfill({ status: 200, body: JSON.stringify([]) });
        });
    }

    // 3. Perform Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.fill('input[name="email"]', role.email);
    await page.fill('input[name="password"]', 'any-password');
    
    await page.click('button[type="submit"]');

    // 4. Wait for redirect
    await page.waitForURL(url => url.pathname === '/dashboard' || url.pathname === '/', { timeout: 30000 });
    
    // 5. Cache state
    await page.context().storageState({ path: path.join(authDir, `${role.name}.json`) });
  });
}
