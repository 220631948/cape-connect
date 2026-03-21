# QGIS Connection Guide — CapeTown GIS Hub OGC Services

## Overview

The CapeTown GIS Hub exposes OGC-compliant WFS and WMS endpoints that can be consumed
directly by QGIS, ArcGIS Pro, and any OGC-compatible GIS client.

**Base URL:** `{RAILWAY_URL}/ogc`

---

## Available Phase 1 Collections

| Collection ID          | Title                | Type                 |
|------------------------|----------------------|----------------------|
| `cape_town_zoning`     | Cape Town Zoning     | IZS zoning polygons  |
| `cape_town_parcels`    | Cape Town Parcels    | Land parcels         |
| `cape_town_suburbs`    | Cape Town Suburbs    | Suburb boundaries    |
| `cape_town_flood_risk` | Cape Town Flood Risk | Flood susceptibility |

---

## Connecting QGIS via WFS

### Step 1: Open WFS Connection Dialog

1. In QGIS, go to **Layer → Add Layer → Add WFS Layer**
2. Click **New** to create a new connection

### Step 2: Configure Connection

| Field            | Value                                        |
|------------------|----------------------------------------------|
| **Name**         | `CapeTown GIS Hub`                           |
| **URL**          | `https://capegis-api.up.railway.app/ogc/wfs` |
| **Version**      | `2.0.0`                                      |
| **Max features** | `10000` (recommended)                        |

> **Note:** For local development, use `http://localhost:8000/ogc/wfs`

### Step 3: Connect and Add Layers

1. Click **Connect** — QGIS will fetch the GetCapabilities document
2. Select the desired layer(s) from the list
3. Click **Add** to load the layer onto the map

### WFS URL Format

```
{RAILWAY_URL}/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities
```

Example:

```
https://capegis-api.up.railway.app/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities
```

---

## Connecting QGIS via OGC API Features

QGIS 3.28+ supports OGC API Features natively:

1. Go to **Layer → Add Layer → Add WFS / OGC API Features Layer**
2. Click **New** and enter:
    - **Name:** `CapeTown GIS Hub OGC API`
    - **URL:** `https://capegis-api.up.railway.app/ogc`
3. Click **Connect** to browse available collections
4. Select a collection and click **Add**

---

## Connecting ArcGIS Pro via WFS

1. In ArcGIS Pro, go to **Insert → Connections → New WFS Server**
2. Enter the server URL:
   ```
   https://capegis-api.up.railway.app/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities
   ```
3. Click **OK** to save the connection
4. Browse the WFS server in the Catalog pane
5. Drag a layer onto the map

---

## Tenant Collections (Authenticated)

Tenant-specific collections require an API key passed as a query parameter.
OGC clients (QGIS, ArcGIS) typically cannot send Authorization headers, so we use
query parameter authentication:

```
{RAILWAY_URL}/ogc/collections/tenant_{slug}_uploads/items?api_key={YOUR_API_KEY}
```

In QGIS, append the `api_key` parameter to the WFS URL:

```
https://capegis-api.up.railway.app/ogc/wfs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetCapabilities&api_key={YOUR_API_KEY}
```

> **Security note:** API keys in URLs are visible in logs. Use short-lived keys
> and rotate them regularly.

---

## Attribution

All data served through OGC endpoints includes the following attribution:

- **Base map data:** © OpenStreetMap contributors (ODbL)
- **Map tiles:** by CARTO (CC BY 3.0)
- **Spatial data:** City of Cape Town Open Data Portal

---

## Troubleshooting

| Issue              | Solution                                                                 |
|--------------------|--------------------------------------------------------------------------|
| Connection timeout | Check that the Railway backend is deployed and running                   |
| Empty layer        | Verify the PostGIS database has data for the requested collection        |
| 401 Unauthorized   | Tenant collections require `api_key` parameter                           |
| CORS errors (web)  | OGC endpoints are for desktop GIS clients; use the REST API for web apps |

---

## References

- [OGC API Features Standard](https://ogcapi.ogc.org/features/)
- [QGIS WFS Client Documentation](https://docs.qgis.org/3.34/en/docs/user_manual/working_with_ogc/ogc_client_support.html#wfs-and-wcs-client)
- [pygeoapi Documentation](https://docs.pygeoapi.io/en/stable/)
