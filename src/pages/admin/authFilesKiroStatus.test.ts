import { describe, expect, it } from 'vitest';

import {
	hasDeviceCodeData,
	mergeDeviceCodeField,
	normalizeAuthStatusResponse,
} from './authFilesAuthFlow';

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

	it('keeps previous device fields when poll response omits them', () => {
		expect(mergeDeviceCodeField('https://github.com/login/device', undefined)).toBe(
			'https://github.com/login/device'
		);
		expect(mergeDeviceCodeField('ABCD-EFGH', '')).toBe('ABCD-EFGH');
	});

	it('overrides device fields when poll response provides new values', () => {
		expect(mergeDeviceCodeField('old-url', 'https://new.example.com')).toBe('https://new.example.com');
		expect(mergeDeviceCodeField('old-code', 'WXYZ-1234')).toBe('WXYZ-1234');
	});

	it('detects whether device code data exists', () => {
		expect(hasDeviceCodeData('', '')).toBe(false);
		expect(hasDeviceCodeData('https://verify.example.com', '')).toBe(true);
		expect(hasDeviceCodeData('', 'ABCD-EFGH')).toBe(true);
	});
});
