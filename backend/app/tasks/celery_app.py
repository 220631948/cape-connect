"""
Celery application instance with Railway Redis broker.

Four task queues:
  - spatial:  intersection, buffer, suitability, proximity (30s max, 2 workers)
  - raster:   flood risk, heat island, LULC, SAM (10min max, 1 worker)
  - import:   GV Roll CSV import, large file ingestion (30min max, 1 worker)
  - cache:    ArcGIS cache warming, tile pre-generation (5min max, 1 worker)
"""

from celery import Celery
from celery.schedules import crontab
from kombu import Queue

from app.core.config import settings


def create_celery_app() -> Celery:
    """Create and configure the Celery application."""
    app = Celery(
        "capegis",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
    )

    # Serialization
    app.conf.accept_content = ["json"]
    app.conf.task_serializer = "json"
    app.conf.result_serializer = "json"

    # Timezone — Cape Town
    app.conf.timezone = "Africa/Johannesburg"
    app.conf.enable_utc = True

    # Task queues
    app.conf.task_queues = [
        Queue("spatial", routing_key="spatial.#"),
        Queue("raster", routing_key="raster.#"),
        Queue("import", routing_key="import.#"),
        Queue("cache", routing_key="cache.#"),
    ]

    app.conf.task_default_queue = "spatial"
    app.conf.task_default_routing_key = "spatial.default"

    # Task routing
    app.conf.task_routes = {
        "app.tasks.flood_risk.*": {"queue": "raster", "routing_key": "raster.flood"},
        "app.tasks.heat_island.*": {"queue": "raster", "routing_key": "raster.heat"},
        "app.tasks.lulc_classification.*": {
            "queue": "raster",
            "routing_key": "raster.lulc",
        },
        "app.tasks.sam_inference.*": {"queue": "raster", "routing_key": "raster.sam"},
        "app.tasks.anomaly_detection.*": {
            "queue": "spatial",
            "routing_key": "spatial.anomaly",
        },
        "app.tasks.nl_spatial_query.*": {
            "queue": "spatial",
            "routing_key": "spatial.nl",
        },
        "app.tasks.cache_warmer.*": {"queue": "cache", "routing_key": "cache.warm"},
    }

    # Time limits per queue (soft/hard in seconds)
    app.conf.task_time_limit = 600  # 10 min global hard limit
    app.conf.task_soft_time_limit = 540  # 9 min soft limit
    app.conf.task_annotations = {
        "app.tasks.flood_risk.*": {"time_limit": 600, "soft_time_limit": 540},
        "app.tasks.heat_island.*": {"time_limit": 600, "soft_time_limit": 540},
        "app.tasks.lulc_classification.*": {"time_limit": 600, "soft_time_limit": 540},
        "app.tasks.sam_inference.*": {"time_limit": 600, "soft_time_limit": 540},
        "app.tasks.anomaly_detection.*": {"time_limit": 30, "soft_time_limit": 25},
        "app.tasks.nl_spatial_query.*": {"time_limit": 30, "soft_time_limit": 25},
        "app.tasks.cache_warmer.*": {"time_limit": 300, "soft_time_limit": 270},
    }

    # Worker concurrency per queue (used in docker-compose / Railway service config)
    # spatial: 2 workers, raster: 1, import: 1, cache: 1
    app.conf.worker_concurrency = 2  # default for spatial queue
    app.conf.worker_prefetch_multiplier = 1  # one task at a time for heavy tasks

    # Result expiry — 24 hours
    app.conf.result_expires = 86400

    # Task acknowledgement — late ack for reliability
    app.conf.task_acks_late = True
    app.conf.task_reject_on_worker_lost = True

    # Beat schedule — periodic tasks
    app.conf.beat_schedule = {
        "warm-arcgis-cache-daily": {
            "task": "app.tasks.cache_warmer.warm_all_layers",
            "schedule": crontab(hour=0, minute=0),  # 02:00 SAST = 00:00 UTC
            "options": {"queue": "cache"},
        },
    }

    # Auto-discover tasks
    app.autodiscover_tasks(
        [
            "app.tasks.flood_risk",
            "app.tasks.heat_island",
            "app.tasks.lulc_classification",
            "app.tasks.anomaly_detection",
            "app.tasks.nl_spatial_query",
            "app.tasks.cache_warmer",
        ]
    )

    return app


celery_app = create_celery_app()
