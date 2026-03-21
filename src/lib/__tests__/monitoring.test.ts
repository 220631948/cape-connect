import { describe, it, expect, vi, beforeEach } from 'vitest';
import { monitor } from '../monitoring';
import * as Sentry from '@sentry/nextjs';

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

describe('Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs to console in development mode', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development' });

    monitor.log('test_event', { key: 'value' }, 'info');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('📊 [Monitor] test_event'),
      { key: 'value' }
    );

    Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv });
    consoleSpy.mockRestore();
  });

  it('sends events to Sentry when SENTRY_DSN is set', () => {
    const originalSentryDsn = process.env.SENTRY_DSN;
    process.env.SENTRY_DSN = 'https://example-dsn@sentry.io/123';

    monitor.log('test_sentry_event', { foo: 'bar' }, 'warn');

    expect(Sentry.captureMessage).toHaveBeenCalledWith('test_sentry_event', {
      extra: { foo: 'bar' },
      level: 'warning',
    });

    process.env.SENTRY_DSN = originalSentryDsn;
  });

  it('uses captureException for errors if an error is provided', () => {
    const originalSentryDsn = process.env.SENTRY_DSN;
    process.env.SENTRY_DSN = 'https://example-dsn@sentry.io/123';
    const error = new Error('test error');

    monitor.trackError(error, { context: 'test' });

    expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.objectContaining({
      extra: expect.objectContaining({
        context: 'test'
      })
    }));

    process.env.SENTRY_DSN = originalSentryDsn;
  });
});
