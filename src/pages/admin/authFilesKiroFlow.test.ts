import { describe, expect, it } from 'vitest';

import { normalizeTokenStartResponse } from './authFilesAuthFlow';

describe('normalizeTokenStartResponse', () => {
	it('supports kiro device_code response without url', () => {
		const out = normalizeTokenStartResponse({ state: 's1', method: 'device_code' });
		expect(out.state).toBe('s1');
		expect(out.url).toBeUndefined();
		expect(out.method).toBe('device_code');
	});

	it('keeps oauth url response shape for existing providers', () => {
		const out = normalizeTokenStartResponse({ state: 's2', url: 'https://example.com' });
		expect(out.state).toBe('s2');
		expect(out.url).toBe('https://example.com');
		expect(out.method).toBeUndefined();
	});

	it('supports providers that return state and url only', () => {
		const out = normalizeTokenStartResponse({ state: 's3', url: 'https://example.com/device' });
		expect(out.state).toBe('s3');
		expect(out.url).toBe('https://example.com/device');
	});
});
