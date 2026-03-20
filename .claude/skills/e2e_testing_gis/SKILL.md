---
name: e2e-testing-gis
description: Playwright E2E testing patterns for the CapeTown GIS Hub. Covers MapLibre interaction testing, tile load assertions, POPIA guest-mode scenarios, and three-tier fallback verification.
---

<!--
origin: affaan-m/everything-claude-code/skills/e2e-testing/
adaptation-summary: Added MapLibre-specific page objects, tile load wait patterns,
  POPIA guest-mode test scenarios, RLS cross-tenant isolation tests,
  and three-tier fallback path verification via Playwright network mocking.
-->

# E2E Testing — GIS Hub Playwright Patterns

## Page Object: MapPage

```typescript
// playwright/pages/map.page.ts
import { Page, Locator } from "@playwright/test";

export class MapPage {
  readonly map: Locator;
  readonly sourceBadge: Locator;
  readonly layerToggle: (name: string) => Locator;

  constructor(private page: Page) {
    this.map = page.getByTestId("maplibre-container");
    this.sourceBadge = page.getByTestId("source-badge");
    this.layerToggle = (name) => page.getByTestId(`layer-toggle-${name}`);
  }

  async waitForMapLoad() {
    // Wait for MapLibre 'load' event via window message
    await this.page.waitForFunction(
      () => (window as any).__mapLoaded === true,
      { timeout: 10_000 },
    );
  }

  async waitForTilesLoaded() {
    await this.page.waitForFunction(
      () => (window as any).__tilesLoaded === true,
      { timeout: 15_000 },
    );
  }

  async assertSourceBadgeVisible(
    source: string,
    status: "LIVE" | "CACHED" | "MOCK",
  ) {
    await this.sourceBadge
      .filter({ hasText: source })
      .filter({ hasText: status })
      .waitFor();
  }
}
```

## Three-Tier Fallback Test Pattern

```typescript
test("shows MOCK badge when API and cache unavailable", async ({ page }) => {
  // Block live API
  await page.route("**/api/suburbs", (route) => route.abort());
  // Block Supabase cache
  await page.route("**/rest/v1/api_cache**", (route) => route.abort());

  const map = new MapPage(page);
  await page.goto("/");
  await map.waitForMapLoad();
  await map.assertSourceBadgeVisible("ODP", "MOCK");
});
```

## Guest Mode Test Scenarios

```typescript
test.describe("Guest mode restrictions", () => {
  test("sees suburb boundaries but not risk layers", async ({ page }) => {
    await page.goto("/"); // no auth = guest
    const map = new MapPage(page);
    await map.waitForMapLoad();
    await expect(map.layerToggle("suburbs")).toBeVisible();
    await expect(map.layerToggle("flood-risk")).not.toBeVisible();
  });

  test("cannot access property details", async ({ page }) => {
    // Click a parcel at zoom ≥ 14
    await expect(page.getByTestId("property-detail-panel")).not.toBeVisible();
    await expect(page.getByTestId("sign-up-prompt")).toBeVisible();
  });
});
```

## Spatial Bounds Assertion

```typescript
test("map initialises at Cape Town centre", async ({ page }) => {
  await page.goto("/");
  const centre = await page.evaluate(() => {
    const map = (window as any).__map;
    return { lng: map.getCenter().lng, lat: map.getCenter().lat };
  });
  expect(centre.lng).toBeCloseTo(18.4241, 2);
  expect(centre.lat).toBeCloseTo(-33.9249, 2);
});
```

## Attribution Assertion (WCAG AA)

```typescript
test("CartoDB attribution is visible", async ({ page }) => {
  await page.goto("/");
  const attr = page.getByText("© CARTO");
  await expect(attr).toBeVisible();
  // Check contrast ratio ≥ 4.5:1
  const color = await attr.evaluate((el) => getComputedStyle(el).color);
  // Add your contrast check here
});
```

## Network Mocking for Tile Tests

```typescript
test("loads Martin MVT tiles", async ({ page }) => {
  let tileRequests = 0;
  page.on("request", (req) => {
    if (req.url().includes("/tiles/")) tileRequests++;
  });
  await page.goto("/");
  await new MapPage(page).waitForTilesLoaded();
  expect(tileRequests).toBeGreaterThan(0);
});
```

## Checklist for GIS E2E Tests

- [ ] MapPage.waitForMapLoad() before any map assertion
- [ ] Three-tier fallback covered: LIVE/CACHED/MOCK states tested
- [ ] Guest mode: each restricted feature has a test
- [ ] Source badge visible for every data layer
- [ ] Map centre and initial zoom verified
- [ ] CartoDB attribution visible (WCAG AA)
- [ ] RLS: cross-tenant data isolation test (two separate tenant logins)
