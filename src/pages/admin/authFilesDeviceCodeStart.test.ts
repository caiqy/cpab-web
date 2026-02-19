import { describe, expect, it } from 'vitest';

import { normalizeTokenStartResponse } from './authFilesAuthFlow';

describe('normalizeTokenStartResponse device code payloads', () => {
	it('normalizes response with verification_uri and user_code', () => {
		const out = normalizeTokenStartResponse({
			state: 's-device',
			verification_uri: 'https://github.com/login/device',
			user_code: 'ABCD-EFGH',
		});
		expect(out.state).toBe('s-device');
		expect(out.verification_uri).toBe('https://github.com/login/device');
		expect(out.verification_url).toBe('https://github.com/login/device');
		expect(out.user_code).toBe('ABCD-EFGH');
	});

	it('normalizes response with verification_url and user_code', () => {
		const out = normalizeTokenStartResponse({
			state: 's-kilo',
			verification_url: 'https://api.kilo.ai/device',
			user_code: 'WXYZ-1234',
		});
		expect(out.state).toBe('s-kilo');
		expect(out.verification_url).toBe('https://api.kilo.ai/device');
		expect(out.user_code).toBe('WXYZ-1234');
	});
});
