import { describe, expect, it } from 'vitest';

import {
    buildProviderImportPayload,
    parseEntriesFromJsonText,
    sanitizeEntryForProvider,
} from './providerImportSchema';

describe('providerImportSchema', () => {
    it('builds payload from json object and array', () => {
        const one = parseEntriesFromJsonText('{"key":"a","access_token":"x"}');
        expect(one.entries).toHaveLength(1);

        const many = parseEntriesFromJsonText('[{"key":"a","access_token":"x"},{"key":"b","access_token":"y"}]');
        expect(many.entries).toHaveLength(2);
    });

    it('rejects invalid json text', () => {
        const out = parseEntriesFromJsonText('{oops');
        expect(out.error).toBeTruthy();
    });

    it('normalizes provider before submit', () => {
        const payload = buildProviderImportPayload({
            provider: 'anthropic',
            source: 'text',
            authGroupIDs: [1],
            entries: [{ key: 'claude-main', access_token: 'token-a' }],
        });
        expect(payload.provider).toBe('anthropic');
        expect(payload.entries[0].type).toBe('claude');
    });

    it('keeps only required fields for provider payload', () => {
        const sanitized = sanitizeEntryForProvider('kiro', {
            key: 'kiro-main',
            access_token: 'token-a',
            refresh_token: 'token-b',
            noisy: true,
        });
        expect(sanitized.key).toBe('kiro-main');
        expect(sanitized.type).toBe('kiro');
        expect((sanitized as Record<string, unknown>).noisy).toBeUndefined();
    });
});
