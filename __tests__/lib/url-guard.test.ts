import { describe, it, expect } from 'vitest';
import { safeFetchUrl } from '@/lib/url-guard';

describe('safeFetchUrl (SSRF guard)', () => {
  it('accepts a public https URL', () => {
    expect(safeFetchUrl('https://example.com')).not.toBeNull();
  });

  it('rejects loopback (127.x)', () => {
    expect(safeFetchUrl('http://127.0.0.1/')).toBeNull();
    expect(safeFetchUrl('http://127.1.2.3/')).toBeNull();
  });

  it('rejects private ranges', () => {
    expect(safeFetchUrl('http://10.0.0.1/')).toBeNull();
    expect(safeFetchUrl('http://192.168.1.1/')).toBeNull();
    expect(safeFetchUrl('http://172.16.0.1/')).toBeNull();
  });

  it('rejects cloud metadata endpoint', () => {
    expect(safeFetchUrl('http://169.254.169.254/latest/meta-data/')).toBeNull();
  });

  it('rejects non-http(s) protocols', () => {
    expect(safeFetchUrl('file:///etc/passwd')).toBeNull();
    expect(safeFetchUrl('ftp://example.com')).toBeNull();
    expect(safeFetchUrl('gopher://example.com')).toBeNull();
  });

  it('rejects garbage input', () => {
    expect(safeFetchUrl('')).toBeNull();
  });
});
