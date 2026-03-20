# ADR 004: Billing & Subscription Model (Stripe)

> **TL;DR:** Selected Stripe over PayStack and Peach Payments for multi-tenant SaaS billing with ZAR support, webhook-driven provisioning, and PCI compliance offloading.

**Status:** Accepted
**Date:** 2026-03-01
**Deciders:** Senior GIS Architect, Technical Co-founder

## Context

The platform is a multi-tenant SaaS requiring subscriptions, seat management, and feature gating (e.g., GV Roll valuations). Must support South African ZAR payments.

## Decision Drivers

- **Multi-tenancy:** Billing at the tenant (organization) level
- **Security:** Avoid handling credit card data directly
- **Automation:** Webhook support for automatic provisioning
- **Scalability:** Multiple tiers (Free, Starter, Professional)

## Considered Options

1. **PayStack:** Strong SA support, less robust complex subscription modeling
2. **Peach Payments:** Excellent local gateway, more custom implementation needed
3. **Stripe:** Global leader, superior API, robust subscription management

## Decision

Chosen option: **Stripe**. Each `tenant_id` maps to a `stripe_customer_id`.

### Implementation Strategy

- **Stripe Customer:** Created on Tenant Admin registration
- **Stripe Subscription:** Gates GIS features via `tenant_settings.plan_tier`
- **Webhooks:** Supabase Edge Functions listen for `invoice.paid` and `customer.subscription.deleted`

## Consequences

- **Good:** Reduced PCI compliance burden, automated billing cycles
- **Bad:** ZAR settlement details need verification for SA bank accounts [ASSUMPTION — UNVERIFIED]
- **Neutral:** Requires `stripe_customer_id` and `stripe_subscription_id` in `tenants` table

## Acceptance Criteria

- [ ] Stripe Customer created on tenant registration
- [ ] Subscription tiers gate feature access correctly
- [ ] Webhook handler processes `invoice.paid` and updates tenant state
- [ ] ZAR payment flow verified end-to-end
