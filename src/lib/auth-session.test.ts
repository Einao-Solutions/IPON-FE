import { describe, expect, it } from 'vitest';
import { buildCookieOptions } from './auth-session';
import { normalizeImageUrl } from './helpers';

describe('buildCookieOptions', () => {
  it('omits secure flag for localhost development', () => {
    expect(buildCookieOptions({ maxAge: 3600, isSecure: false })).toContain('max-age=3600');
    expect(buildCookieOptions({ maxAge: 3600, isSecure: false })).not.toContain('secure');
  });

  it('includes secure flag for https production', () => {
    const value = buildCookieOptions({ maxAge: 3600, isSecure: true });
    expect(value).toContain('secure');
    expect(value).toContain('max-age=3600');
  });
});

describe('normalizeImageUrl', () => {
  it('rewrites localhost image URLs to the current app origin in dev', () => {
    const current = 'https://dev.iponigeria.com';
    const normalized = normalizeImageUrl('http://localhost:5044/api/files/attachment?id=abc', current);
    expect(normalized).toBe('https://dev.iponigeria.com/api/files/attachment?id=abc');
  });

  it('keeps valid remote image URLs unchanged', () => {
    const current = 'https://dev.iponigeria.com';
    const normalized = normalizeImageUrl('https://backend.einaotest.com/api/files/attachment?id=123', current);
    expect(normalized).toBe('https://backend.einaotest.com/api/files/attachment?id=123');
  });
});
