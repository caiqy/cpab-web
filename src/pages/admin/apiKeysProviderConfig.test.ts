import { describe, expect, it } from 'vitest';

import { buildApiKeyPayload, buildProviderOptions, getProviderLabel, requiresBaseURL } from './ApiKeys';

const t = (key: string) => key;

describe('ApiKeys provider config', () => {
    it('includes vertex in provider options', () => {
        const options = buildProviderOptions(t);
        expect(options.some((opt) => opt.value === 'vertex')).toBe(true);
    });

    it('shows gemini as AI Studio label', () => {
        expect(getProviderLabel('gemini', t)).toBe('AI Studio（Gemini API Key）');
    });

    it('requires base URL for vertex and other compatible providers', () => {
        expect(requiresBaseURL('vertex')).toBe(true);
        expect(requiresBaseURL('codex')).toBe(true);
        expect(requiresBaseURL('openai-compatibility')).toBe(true);
        expect(requiresBaseURL('gemini')).toBe(false);
    });

    it('builds payload with whitelist_enabled and omits excluded_models when enabled', () => {
        const payload = buildApiKeyPayload({
            provider: 'claude',
            name: 'claude-main',
            priority: 0,
            apiKey: 'sk-test',
            prefix: '',
            baseURL: '',
            proxyURL: '',
            headersList: [{ key: 'X-Test', value: '1' }],
            modelsList: [{ name: 'claude-sonnet-4-6', alias: '' }],
            excludedModelsList: ['claude-opus-4-1'],
            apiKeyEntries: [],
            whitelistEnabled: true,
        });

        expect(payload.whitelist_enabled).toBe(true);
        expect(payload.models).toHaveLength(1);
        expect(payload.excluded_models).toBeUndefined();
    });

    it('forces whitelist_enabled=false for unsupported providers', () => {
        const payload = buildApiKeyPayload({
            provider: 'vertex',
            name: 'vertex-main',
            priority: 0,
            apiKey: 'vk-test',
            prefix: '',
            baseURL: 'https://vertex.example.com',
            proxyURL: '',
            headersList: [],
            modelsList: [{ name: 'gemini-2.5-flash', alias: '' }],
            excludedModelsList: ['gemini-2.5-pro'],
            apiKeyEntries: [],
            whitelistEnabled: true,
        });

        expect(payload.whitelist_enabled).toBe(false);
        expect(payload.excluded_models).toBeUndefined();
    });
});
