# 06 GeoAI & Real-Time Integration

> **TL;DR:** GeoAI has evolved to Spatial RAG (PostGIS + pgvector). MobilityDB handles moving-object trajectories efficiently. Supabase Realtime enables live map updates. Score: 7/10 — hold for Phase 3. Build static map first, add live features later. Too complex for MVP.
>
> **Roadmap Relevance:** M10+ (Phase 3 Intelligence) — pgvector for Spatial RAG, MobilityDB for asset tracking, Supabase Realtime for live dashboards. All deferred.

## Overview & 2026 Status
In 2026, "GeoAI" has moved beyond building footprint detection into the world of **Spatial RAG (Retrieval-Augmented Generation)**. Organizations are no longer just asking "where" things are, but are combining spatial context (PostGIS) with semantic intelligence (pgvector). 

On the real-time front, the ecosystem has moved away from monolithic "Event Servers" toward lightweight, distributed stream processing. **MobilityDB** (built on PostGIS) has emerged as the definitive tool for handling moving object trajectories (like tracking Cape Town's MyCiTi bus fleet or emergency vehicles).

## Integration with PostGIS
*   **pgvector:** [VERIFIED] Now natively supported in Supabase, this allows us to store AI embeddings alongside our geometries. We can query for "properties that look like this one" in a single SQL statement.
*   **MobilityDB:** An extension that adds temporal types to PostGIS. Instead of storing a thousand GPS points, you store one "trajectory" object, which allows for blazingly fast spatiotemporal queries (e.g., "Find all buses that were within 100m of this property between 2pm and 3pm").
*   **MQTT + Next.js 15:** Real-time data feeds (e.g., from IoT sensors monitoring Western Cape water levels) are typically ingested via an MQTT broker (like Mosquitto) and pushed to the map via WebSockets or Supabase Realtime.

## Pros & Cons Table
| Pro | Con |
|-----|-----|
| (pgvector) One database for both maps and AI; simplifies the entire stack. | (GeoAI) Training and running Large Language Models (LLMs) for GIS is still expensive. |
| (MobilityDB) Handles moving assets as continuous paths, not just dots on a map. | (Real-time) High-throughput streams can quickly overwhelm standard Postgres instances if not partitioned. |
| (Supabase Realtime) Built-in broadcast/presence makes "who is looking at the map" features easy. | Managing MQTT brokers and sensor security adds significant operational overhead. |

## Recommendation Scorecard
| Criterion                  | Score (1–10) | Notes |
|----------------------------|-------------|-------|
| MVP Fit                    | 5           | Too advanced for the MVP; focus on static data first. |
| Scalability                | 9           | MobilityDB and Kafka/Flink can scale to millions of events. |
| Multitenancy Support       | 8           | RLS works for real-time streams, but requires careful implementation. |
| Maintenance Effort         | 4           | Real-time pipelines are notorious for being hard to debug. |
| Cost / Licensing           | 9           | Most core components are open source. |
| Cape Town / WC Relevance   | 10          | Essential for tracking public transport or disaster response teams. |
| **Overall Recommendation** | **7.0**     | **Hold for Phase 3.** Build the static map first, then add "Live" features. |

## Example Integration (Next.js 15 + Supabase Realtime)
Using Supabase Realtime to broadcast vehicle positions to all tenants:

```typescript
// app/components/LiveVehicles.tsx
'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LiveVehicles() {
  useEffect(() => {
    // Subscribing to real-time updates for vehicle positions
    const channel = supabase.channel('realtime:vehicles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trajectories' }, payload => {
        console.log('Vehicle moved!', payload.new);
        // Update the MapLibre marker position here...
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return null; // This is a background logic component
}
```

## Relevance to Our White-Label Cape Town GIS Project
Imagine giving a Property Developer (Sipho) a live "Activity Heatmap" of Cape Town. By ingesting real-time movement data (anonymized), we could show him exactly which street corners get the most foot traffic at 8am vs 8pm. That's not just a map; that's **Investment Intelligence**. While too complex for the MVP, having a stack (Supabase + PostGIS) that *can* support this in the future is a huge strategic win.
