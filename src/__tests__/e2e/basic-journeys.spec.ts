import { test, expect } from '@playwright/test';

test.describe('GIS Hub Basic User Journeys', () => {
  test('Successful Login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/CapeTown GIS Hub/i);

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Property Search + Selection', async ({ page }) => {
    // Skip login for now if middleware allows or assume logged in
    await page.goto('/');
    
    const searchInput = page.getByPlaceholder('Search Address or ERF...');
    await searchInput.fill('Woodstock');
    
    // Wait for autocomplete
    const results = page.locator('strong');
    await expect(results.first()).toBeVisible();
    
    // Select first result
    await results.first().click();
    
    // Input should clear/update to address
    await expect(searchInput).not.toHaveValue('Woodstock');
  });

  test('Draw Polygon + Analysis Panel', async ({ page }) => {
    await page.goto('/');
    
    // Enter draw mode
    await page.click('button:has-text("Enter Draw Mode")');
    
    // Click on the map to draw (simulation)
    const map = page.locator('.maplibregl-canvas');
    await map.click({ position: { x: 100, y: 100 } });
    await map.click({ position: { x: 200, y: 100 } });
    await map.click({ position: { x: 200, y: 200 } });
    await map.click({ position: { x: 100, y: 100 } }); // Close polygon
    
    // Check if analysis panel appeared
    await expect(page.locator('text=Analysis Results')).toBeVisible();
  });
});
