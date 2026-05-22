import { describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('app', () => {
  it('responds to health checks', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
    });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('allows delete requests from the frontend cors preflight', async () => {
    const app = await buildApp();
    const response = await app.inject({
      headers: {
        'access-control-request-headers': 'authorization,content-type',
        'access-control-request-method': 'DELETE',
        origin: 'http://localhost:3000',
      },
      method: 'OPTIONS',
      url: '/repertories/00000000-0000-4000-8000-000000000000/songs/00000000-0000-4000-8000-000000000000',
    });

    await app.close();

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain(
      'DELETE',
    );
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
    expect(response.headers['access-control-allow-headers']).toContain(
      'authorization',
    );
  });

  it('does not allow cors requests from untrusted origins', async () => {
    const app = await buildApp();
    const response = await app.inject({
      headers: {
        origin: 'https://malicious.example',
      },
      method: 'GET',
      url: '/health',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
