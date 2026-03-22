import { describe, it, expect } from 'vitest';
import { GET } from '../../app/api/health/route';

describe('Health API', () => {
  it('returns 200 OK with status and timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
  });
});
