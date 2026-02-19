import { describe, expect, it } from 'vitest';

import { buildProviderOptions, getProviderLabel, requiresBaseURL } from './ApiKeys';

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
});
