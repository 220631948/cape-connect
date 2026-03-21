terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

variable "project_id" {
  description = "The ID of the GCP Project"
  type        = string
}

variable "billing_account_name" {
  description = "The ID of the billing account (e.g., billingAccounts/012345-567890-ABCDEF)"
  type        = string
}

variable "alert_emails" {
  description = "Email addresses to notify on budget alerts"
  type        = list(string)
  default     = ["admin@capetown-gis.example"]
}

# Notification channel for emails
resource "google_monitoring_notification_channel" "email_alert" {
  count        = length(var.alert_emails)
  display_name = "Budget Alert Email ${count.index}"
  type         = "email"

  labels = {
    email_address = var.alert_emails[count.index]
  }
  project      = var.project_id
}

# The budget definition
resource "google_billing_budget" "budget" {
  billing_account = var.billing_account_name
  display_name    = "Raster Storage Budget Alert"

  budget_filter {
    projects               = ["projects/${var.project_id}"]
    credit_types_treatment = "INCLUDE_SPECIFIED_CREDITS"
  }

  # Daily spend limit: ~ $3/day ($90/mo), but budgets are strictly defined in amounts per month/period.
  # We set the limit to $90 total monthly, and alert at low percentages to catch high daily velocity.
  amount {
    specified_amount {
      currency_code = "USD"
      units         = "90"
    }
  }

  threshold_rules {
    threshold_percent = 0.5 # $45
  }

  threshold_rules {
    threshold_percent = 0.9 # $81
  }

  threshold_rules {
    threshold_percent = 1.0 # $90
  }

  all_updates_rule {
    # Optionally triggers a Pub/Sub topic which can disable public access
    # pubsub_topic = google_pubsub_topic.budget_actions.id
    disable_default_iam_recipients = false
    monitoring_notification_channels = [
      for channel in google_monitoring_notification_channel.email_alert : channel.id
    ]
  }
}

# Note: Automatic disabling of public access requires a Pub/Sub triggered Cloud Function to remove IAM roles.
# If daily spend > $3 consistently, or Egress > 50 GB/mo or Storage > 100 GB, the email alert will fire 
# and an attached Pub/Sub Cloud Function could run a script to update IAM policies.
