# 05 Python Geo Stack (GeoDjango · GeoPandas · TorchGeo · Rasterio)

> **TL;DR:** Python geo stack is optional for MVP (score 7.5/10). GeoPandas 1.0+ with Apache Arrow is 10–50x faster. TorchGeo enables satellite imagery AI. Use only when PostGIS SQL is insufficient — e.g., land-use change detection or building classification from aerial imagery. Keep the core app in Next.js.
>
> **Roadmap Relevance:** M10+ (Intelligence Phase) — Python services become relevant when AI classification features are built. Not needed before Phase 3.

## Overview & 2026 Status
While our core SaaS platform is built on Next.js 15, any sophisticated spatial analysis or machine learning happens in the Python ecosystem. In 2026, the stack has matured significantly:
*   **GeoPandas (v1.0+):** [VERIFIED] Now supports Apache Arrow natively, making it 10–50x faster for large vector datasets.
*   **GeoDjango:** Remains the gold standard for building enterprise GIS backends, now with improved async support in Django 6.0.
*   **TorchGeo (v0.8+):** The go-to for Geospatial AI. It has transitioned toward "Geospatial Foundation Models," allowing for rapid fine-tuning of satellite imagery classification tasks.
*   **Rasterio:** The industry-standard "plumbing" for reading/writing Cloud Optimized GeoTIFFs (COGs).

## Integration with PostGIS
Python connects to PostGIS primarily via **SQLAlchemy** or **GeoAlchemy2**. 
*   **GeoPandas** can read/write directly to PostGIS using `geopandas.read_postgis()`.
*   **GeoDjango** maps Python classes to PostGIS tables using its built-in ORM, handling spatial indexing and geometry storage automatically.
*   **Rasterio** can be used to process raw imagery from the Western Cape's hazard layers and then export the results as vector polygons into PostGIS for our web app to consume.

## Pros & Cons Table
| Pro | Con |
|-----|-----|
| (GeoPandas) Incredibly intuitive for data scientists; "Excel for maps." | (GeoDjango) Heavyweight; often overkill for simple data microservices. |
| (TorchGeo) Pre-trained models for land-cover classification and building detection. | (Python Stack) High memory overhead compared to Rust (Martin) or Go (pg_tileserv). |
| (Rasterio) Native support for COGs means you only stream the pixels you need. | Managing Python environments (Conda/Poetry) in Docker can be brittle. |

## Recommendation Scorecard
| Criterion                  | Score (1–10) | Notes |
|----------------------------|-------------|-------|
| MVP Fit                    | 6           | Likely too heavy for the initial MVP; stick to PostGIS SQL. |
| Scalability                | 8           | Great for "Big Data" via Dask-GeoPandas. |
| Multitenancy Support       | 7           | GeoDjango handles multi-tenancy well via apps like `django-tenants`. |
| Maintenance Effort         | 6           | Requires managing a separate Python service/runtime. |
| Cost / Licensing           | 10          | All are open source. |
| Cape Town / WC Relevance   | 9           | Critical if we want to run AI classification on WC aerial imagery. |
| **Overall Recommendation** | **7.5**     | **Optional for MVP.** Use this only when we need advanced AI (e.g., detecting new informal structures from satellite data). |

## Example Integration (Next.js 15 calling a Python GeoAPI)
Since we are using Next.js 15, we would likely call a Python service (FastAPI) for heavy analysis:

```typescript
// Next.js 15 Server Component
export async function detectInformalStructures(parcelId: string) {
  // Calling our Python/TorchGeo microservice
  const res = await fetch(`https://ai-analysis.our-saas.com/detect/${parcelId}`, {
    method: 'POST',
    cache: 'no-store' // Next.js 15 default
  });
  
  return res.json();
}
```

*Python (FastAPI + GeoPandas) snippet:*
```python
import geopandas as gpd
from sqlalchemy import create_client

def get_stats(parcel_id):
    # Fetching data from PostGIS into GeoPandas
    df = gpd.read_postgis(f"SELECT * FROM parcels WHERE id='{parcel_id}'", con=engine)
    # Perform complex analysis...
    return df.area.iloc[0]
```

## Relevance to Our White-Label Cape Town GIS Project
The Python stack is our "Secret Weapon." If we want to offer a feature like "Land-use change detection in the Western Cape over the last 10 years," we can't do that in SQL alone. We would use **Rasterio** to read historical satellite imagery, **TorchGeo** to detect changes (urban sprawl), and **GeoPandas** to calculate the areas. This high-end intelligence is what will make our platform stand out against basic map viewers.
