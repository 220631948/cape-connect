import * as Sentry from "@sentry/nextjs";

export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("../sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
      await import("../sentry.edge.config");
    }
  } catch (err) {
    console.warn("[instrumentation] Sentry config missing or failed to load. Continuing without Sentry initialization.", err);
  }
}

export const onRequestError = Sentry.captureRequestError;
