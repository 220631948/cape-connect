/**
 * @file src/app/api/health/route.ts
 * @description Health-check endpoint for E2E readiness gate.
 * No auth required. No personal data handled.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
