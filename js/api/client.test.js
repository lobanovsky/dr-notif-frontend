import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { client, ApiError, buildQueryString, onUnauthenticated, onGlobalError } from './client.js';

const originalFetch = globalThis.fetch;

function mockFetch(impl) {
  globalThis.fetch = impl;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  onUnauthenticated(null);
  onGlobalError(null);
});

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status text',
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('buildQueryString', () => {
  test('omits undefined/null/empty values', () => {
    assert.equal(buildQueryString({ a: 1, b: undefined, c: null, d: '' }), '?a=1');
  });

  test('returns empty string when nothing to build', () => {
    assert.equal(buildQueryString(), '');
    assert.equal(buildQueryString({}), '');
  });
});

describe('client requests', () => {
  test('resolves parsed JSON on success', async () => {
    mockFetch(async () => jsonResponse(200, { ok: true }));
    const result = await client.get('/admin/classes');
    assert.deepEqual(result, { ok: true });
  });

  test('parses the backend\'s flat {"error": "..."} envelope into ApiError.message', async () => {
    mockFetch(async () => jsonResponse(400, { error: 'birth_date must be in YYYY-MM-DD format' }));
    await assert.rejects(
      () => client.post('/admin/students', {}),
      (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.equal(err.message, 'birth_date must be in YYYY-MM-DD format');
        return true;
      },
    );
  });

  test('401 triggers onUnauthenticated and not onGlobalError', async () => {
    mockFetch(async () => jsonResponse(401, { error: 'unauthorized' }));
    let unauthCalls = 0;
    let globalCalls = 0;
    onUnauthenticated(() => unauthCalls++);
    onGlobalError(() => globalCalls++);

    await assert.rejects(() => client.get('/admin/classes'));
    assert.equal(unauthCalls, 1);
    assert.equal(globalCalls, 0);
  });

  test('500 triggers onGlobalError', async () => {
    mockFetch(async () => jsonResponse(500, { error: 'internal error' }));
    let globalCalls = 0;
    onGlobalError(() => globalCalls++);

    await assert.rejects(() => client.get('/admin/classes'));
    assert.equal(globalCalls, 1);
  });

  test('400/404 do not trigger onGlobalError (page handles them)', async () => {
    mockFetch(async () => jsonResponse(404, { error: 'student not found' }));
    let globalCalls = 0;
    onGlobalError(() => globalCalls++);

    await assert.rejects(() => client.get('/admin/students/999'));
    assert.equal(globalCalls, 0);
  });

  test('network failure produces status 0 and triggers onGlobalError', async () => {
    mockFetch(async () => {
      throw new Error('fetch failed');
    });
    let globalError = null;
    onGlobalError((err) => {
      globalError = err;
    });

    await assert.rejects(() => client.get('/admin/classes'));
    assert.equal(globalError.status, 0);
  });
});
