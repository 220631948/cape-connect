/**
 * @file src/lib/monitoring.ts
 * @description Lightweight observability for CapeConnect GIS Hub.
 * @compliance POPIA: Error tracking does not log PII; user IDs are anonymized.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface MonitoringEvent {
  event: string;
  level: LogLevel;
  data?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Lightweight monitoring client.
 * Replace with Sentry SDK when DSN is available:
 *   import * as Sentry from '@sentry/nextjs';
 *   Sentry.init({ dsn: process.env.SENTRY_DSN });
 */
class Monitor {
  private static instance: Monitor;
  private events: MonitoringEvent[] = [];

  static getInstance(): Monitor {
    if (!Monitor.instance) {
      Monitor.instance = new Monitor();
    }
    return Monitor.instance;
  }

  log(event: string, data?: Record<string, unknown>, level: LogLevel = 'info') {
    const entry: MonitoringEvent = {
      event,
      level,
      data,
      timestamp: new Date().toISOString(),
    };

    this.events.push(entry);

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📊';
      console.log(`${prefix} [Monitor] ${event}`, data || '');
    }

    // TODO: Send to Sentry/external when configured
    // if (process.env.SENTRY_DSN) { Sentry.captureMessage(event, { extra: data }); }
  }

  trackApiCall(route: string, tier: string, durationMs: number) {
    this.log('api_call', { route, tier, durationMs });
  }

  trackMapLoad(durationMs: number, layerCount: number) {
    this.log('map_load', { durationMs, layerCount });
  }

  trackFallback(route: string, fromTier: string, toTier: string) {
    this.log('fallback_triggered', { route, fromTier, toTier }, 'warn');
  }

  trackError(error: Error, context?: Record<string, unknown>) {
    this.log('error', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      ...context,
    }, 'error');
  }

  trackLogin(tenantId: string, role: string) {
    this.log('user_login', { tenantId, role });
  }

  getRecentEvents(count = 50): MonitoringEvent[] {
    return this.events.slice(-count);
  }
}

export const monitor = Monitor.getInstance();
export default monitor;
