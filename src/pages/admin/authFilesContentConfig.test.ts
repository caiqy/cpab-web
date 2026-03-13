import { describe, expect, it } from 'vitest';

import {
    buildAuthFileUpdatePayload,
    formatAuthFileContentForEdit,
    getAuthFileContentValidation,
} from './AuthFiles';

describe('AuthFiles content edit helpers', () => {
    it('formats object content as indented json', () => {
        expect(formatAuthFileContentForEdit({ type: 'claude' })).toEqual({
            text: '{\n  "type": "claude"\n}',
            notice: '',
            fallbackUsed: false,
        });
    });

    it('defaults undefined content to empty object without error', () => {
        expect(formatAuthFileContentForEdit(undefined)).toEqual({
            text: '{}',
            notice: '',
            fallbackUsed: false,
        });
    });

    it('keeps non-object json visible and marks it invalid', () => {
        const formatted = formatAuthFileContentForEdit(['a']);
        expect(formatted).toEqual({
            text: '[\n  "a"\n]',
            notice: '',
            fallbackUsed: false,
        });
        expect(getAuthFileContentValidation(formatted.text).error).toBe('Content must be a JSON object.');
    });

    it('keeps null visible and marks it invalid', () => {
        const formatted = formatAuthFileContentForEdit(null);
        expect(formatted).toEqual({
            text: 'null',
            notice: '',
            fallbackUsed: false,
        });
        expect(getAuthFileContentValidation(formatted.text).error).toBe('Content must be a JSON object.');
    });

    it('falls back to empty object and returns non-blocking notice when stringify fails', () => {
        const circular: { self?: unknown } = {};
        circular.self = circular;

        const formatted = formatAuthFileContentForEdit(circular);
        expect(formatted).toEqual({
            text: '{}',
            notice: 'Current content could not be formatted. Initialized with an empty object.',
            fallbackUsed: true,
        });
        expect(getAuthFileContentValidation(formatted.text).error).toBe('');
    });

    it('rejects invalid json text', () => {
        const result = getAuthFileContentValidation('{');
        expect(result.parsedContent).toBeNull();
        expect(result.error).toBe('Content must be valid JSON.');
        expect(result.hasConflict).toBe(false);
    });

    it('rejects non-object parsed json content', () => {
        const result = getAuthFileContentValidation('[]');
        expect(result.parsedContent).toBeNull();
        expect(result.error).toBe('Content must be a JSON object.');
        expect(result.hasConflict).toBe(false);
    });

    it('rejects top-level proxy_url conflicts only', () => {
        const topLevel = getAuthFileContentValidation('{"proxy_url":"http://a"}');
        const nested = getAuthFileContentValidation('{"nested":{"proxy_url":"http://a"}}');
        const caseVariant = getAuthFileContentValidation('{"Proxy_URL":"http://a"}');

        expect(topLevel.hasConflict).toBe(true);
        expect(topLevel.error).toContain('proxy_url');
        expect(nested.hasConflict).toBe(false);
        expect(nested.error).toBe('');
        expect(caseVariant.hasConflict).toBe(false);
    });

    it('includes content in update payload', () => {
        const payload = buildAuthFileUpdatePayload({
            name: 'auth-a',
            key: 'auth-a',
            isAvailable: true,
            proxyUrl: '',
            rateLimit: 0,
            priority: 0,
            whitelistEnabled: false,
            allowedModels: [],
            content: { type: 'claude', access_token: 'token' },
        });

        expect(payload.content).toEqual({ type: 'claude', access_token: 'token' });
    });
});
