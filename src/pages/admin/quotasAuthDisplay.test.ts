import { describe, expect, it } from 'vitest';

import { resolveQuotaAuthTitle } from './Quotas';

describe('resolveQuotaAuthTitle', () => {
    it('uses auth_name when non-empty', () => {
        expect(resolveQuotaAuthTitle('业务主账号', 'file-key.json')).toBe('业务主账号');
    });

    it('falls back to auth_key when auth_name is empty', () => {
        expect(resolveQuotaAuthTitle('   ', 'file-key.json')).toBe('file-key.json');
        expect(resolveQuotaAuthTitle(undefined, 'file-key.json')).toBe('file-key.json');
    });
});
