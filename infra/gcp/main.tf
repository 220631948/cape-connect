# ─────────────────────────────────────────────────────────────────────────────
# CapeTown GIS Hub — GCP Raster Storage Infrastructure
# ─────────────────────────────────────────────────────────────────────────────
# Provisions GCS bucket for COG raster storage in africa-south1 (POPIA compliant).
# Reference: docs/research/GCP_MIGRATION_PLAN.md
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Remote state in GCS (create this bucket manually first, or use local state)
  # backend "gcs" {
  #   bucket = "capegis-terraform-state"
  #   prefix = "infra/gcp"
  # }
}

# ─── Variables ────────────────────────────────────────────────────────────────

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for POPIA-compliant storage"
  type        = string
  default     = "africa-south1"
}

variable "bucket_name" {
  description = "GCS bucket name for raster storage"
  type        = string
  default     = "capegis-rasters"
}

variable "frontend_origins" {
  description = "Allowed CORS origins for frontend COG range requests"
  type        = list(string)
  default = [
    "https://capegis.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ]
}

# ─── Provider ─────────────────────────────────────────────────────────────────

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── GCS Bucket: Raster Storage ──────────────────────────────────────────────

resource "google_storage_bucket" "capegis_rasters" {
  name     = var.bucket_name
  location = var.region

  # Uniform bucket-level access (no per-object ACLs)
  uniform_bucket_level_access = true

  # Storage class: Standard for frequently accessed COG tiles
  storage_class = "STANDARD"

  # Prevent accidental deletion
  force_destroy = false

  # Versioning for rollback safety during migration
  versioning {
    enabled = true
  }

  # CORS: Allow browser-based COG range requests from frontend
  cors {
    origin = var.frontend_origins
    method = ["GET", "HEAD", "OPTIONS"]
    response_header = [
      "Content-Type",
      "Content-Range",
      "Accept-Ranges",
      "Content-Length",
      "Content-Encoding",
      "ETag",
      "Access-Control-Allow-Origin",
    ]
    max_age_seconds = 86400
  }

  # Lifecycle rules: tiered storage to reduce cost for old rasters
  lifecycle_rule {
    condition {
      age = 90 # days
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365 # days
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  # Delete non-current versions after 30 days (versioning cleanup)
  lifecycle_rule {
    condition {
      num_newer_versions = 3
      with_state         = "ARCHIVED"
    }
    action {
      type = "Delete"
    }
  }

  labels = {
    project     = "capegis"
    environment = "production"
    managed_by  = "terraform"
    popia       = "compliant"
  }
}

# ─── Public read access for COG tiles (anonymous range requests) ─────────────

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.capegis_rasters.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ─── Service Account for Backend (upload + manage) ───────────────────────────

resource "google_service_account" "capegis_raster_sa" {
  account_id   = "capegis-raster-sa"
  display_name = "CapeTown GIS Hub - Raster Storage Service Account"
  description  = "Used by backend and Cloud Run for raster upload/management"
}

resource "google_storage_bucket_iam_member" "sa_admin" {
  bucket = google_storage_bucket.capegis_rasters.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.capegis_raster_sa.email}"
}

# ─── Service Account for GEE Export (write-only) ─────────────────────────────

resource "google_service_account" "capegis_gee_writer" {
  account_id   = "capegis-gee-writer"
  display_name = "CapeTown GIS Hub - GEE Export Writer"
  description  = "Write-only access to GCS bucket for Earth Engine exports"
}

resource "google_storage_bucket_iam_member" "gee_writer" {
  bucket = google_storage_bucket.capegis_rasters.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.capegis_gee_writer.email}"
}

# ─── Service Account for Reader Proxy (signed URLs) ─────────────────────────

resource "google_service_account" "capegis_raster_reader" {
  account_id   = "capegis-raster-reader"
  display_name = "CapeTown GIS Hub - Raster Reader (proxy)"
  description  = "Read-only access to GCS raster bucket for Next.js/Supabase proxy"
}

resource "google_storage_bucket_iam_member" "reader_viewer" {
  bucket = google_storage_bucket.capegis_rasters.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.capegis_raster_reader.email}"
}

resource "google_project_iam_member" "reader_token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.capegis_raster_reader.email}"
}

# ─── Cloud Run: Raster Processor ─────────────────────────────────────────────

resource "google_cloud_run_v2_service" "raster_processor" {
  name     = "capegis-raster-processor"
  location = var.region

  template {
    service_account = google_service_account.capegis_raster_sa.email

    containers {
      image = "gcr.io/${var.project_id}/capegis-raster-processor:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }

      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.capegis_rasters.name
      }

      env {
        name  = "GDAL_CACHEMAX"
        value = "256"
      }

      env {
        name  = "CPL_VSIL_CURL_CACHE_SIZE"
        value = "67108864"
      }

      env {
        name  = "GDAL_HTTP_MERGE_CONSECUTIVE_RANGES"
        value = "YES"
      }

      env {
        name  = "GDAL_HTTP_MULTIPLEX"
        value = "YES"
      }

      env {
        name  = "VSI_CACHE"
        value = "TRUE"
      }

      env {
        name  = "VSI_CACHE_SIZE"
        value = "67108864"
      }
    }

    scaling {
      min_instance_count = 0 # Scale to zero (free tier!)
      max_instance_count = 3
    }

    timeout = "300s" # 5 min for large raster processing
  }

  # Allow unauthenticated for health checks; Eventarc uses service account
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

# ─── Eventarc: GCS Upload → Cloud Run ────────────────────────────────────────

resource "google_eventarc_trigger" "raster_upload_trigger" {
  name     = "capegis-raster-upload-trigger"
  location = var.region

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }

  matching_criteria {
    attribute = "bucket"
    value     = google_storage_bucket.capegis_rasters.name
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.raster_processor.name
      region  = var.region
      path    = "/process"
    }
  }

  service_account = google_service_account.capegis_raster_sa.email
}

# ─── Budget Alert ─────────────────────────────────────────────────────────────

resource "google_billing_budget" "capegis_budget" {
  billing_account = var.billing_account_id
  display_name    = "CapeTown GIS Hub - $30/mo ceiling"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "30"
    }
  }

  threshold_rules {
    threshold_percent = 0.5 # Alert at $15
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 0.8 # Alert at $24
    spend_basis       = "CURRENT_SPEND"
  }

  threshold_rules {
    threshold_percent = 1.0 # Alert at $30
    spend_basis       = "CURRENT_SPEND"
  }
}

variable "billing_account_id" {
  description = "GCP billing account ID for budget alerts"
  type        = string
  default     = ""
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "bucket_url" {
  description = "GCS bucket URL for raster storage"
  value       = "gs://${google_storage_bucket.capegis_rasters.name}"
}

output "bucket_public_url" {
  description = "Public HTTPS URL for COG range requests"
  value       = "https://storage.googleapis.com/${google_storage_bucket.capegis_rasters.name}"
}

output "raster_processor_url" {
  description = "Cloud Run raster processor URL"
  value       = google_cloud_run_v2_service.raster_processor.uri
}

output "service_account_email" {
  description = "Service account email for backend authentication"
  value       = google_service_account.capegis_raster_sa.email
}
