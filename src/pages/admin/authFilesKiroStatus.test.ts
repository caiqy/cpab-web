import { describe, expect, it } from 'vitest';

import { normalizeAuthStatusResponse } from './authFilesAuthFlow';

describe('normalizeAuthStatusResponse', () => {
	it('parses device_code payload with verification data', () => {
		const out = normalizeAuthStatusResponse({
			status: 'device_code',
			verification_url: 'https://example.com/verify',
			user_code: 'ABCD-EFGH',
		});
		expect(out.status).toBe('device_code');
		expect(out.verification_url).toBe('https://example.com/verify');
		expect(out.user_code).toBe('ABCD-EFGH');
	});

	it('parses normal ok payload', () => {
		const out = normalizeAuthStatusResponse({ status: 'ok' });
		expect(out.status).toBe('ok');
		expect(out.error).toBeUndefined();
	});

	it('throws on invalid status shape', () => {
		expect(() => normalizeAuthStatusResponse({ status: 1 })).toThrowError('Invalid auth status response');
	});
});
