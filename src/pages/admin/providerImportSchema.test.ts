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
            entries: [{ access_token: 'token-a', email: 'User@Example.com ' }],
        });
        expect(payload.provider).toBe('anthropic');
        expect((payload.entries[0] as Record<string, unknown>).type).toBeUndefined();
        expect((payload.entries[0] as Record<string, unknown>).key).toBeUndefined();
    });

    it('keeps only required fields for provider payload', () => {
        const sanitized = sanitizeEntryForProvider('kiro', {
            access_token: 'token-a',
            refresh_token: 'token-b',
            noisy: true,
        });
        expect((sanitized as Record<string, unknown>).key).toBeUndefined();
        expect((sanitized as Record<string, unknown>).type).toBeUndefined();
        expect((sanitized as Record<string, unknown>).noisy).toBeUndefined();
    });

    it('supports iflow three-mode inputs', () => {
        const apiKeyMode = sanitizeEntryForProvider('iflow-cookie', { api_key: 'api-key-only' });
        expect(apiKeyMode.api_key).toBe('api-key-only');

        const cookieMode = sanitizeEntryForProvider('iflow-cookie', { cookie: 'BXAuth=demo', email: 'demo@example.com' });
        expect(cookieMode.cookie).toBe('BXAuth=demo');
        expect(cookieMode.email).toBe('demo@example.com');

        const oauthMode = sanitizeEntryForProvider('iflow-cookie', { refresh_token: 'rt-1' });
        expect(oauthMode.refresh_token).toBe('rt-1');
    });
});
