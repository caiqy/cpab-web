import { describe, expect, it } from 'vitest';

import { toProviderDropdownOptions, type AdminProviderCatalogItem } from './providerCatalog';

describe('providerCatalog', () => {
    it('maps backend catalog to dropdown options in order', () => {
        const input: AdminProviderCatalogItem[] = [
            { id: 'gemini-cli', label: 'Gemini CLI', category: 'oauth', supports_models: true },
            { id: 'kiro', label: 'Kiro', category: 'oauth', supports_models: true },
            { id: 'qwen', label: 'Qwen', category: 'oauth', supports_models: true },
        ];

        const out = toProviderDropdownOptions(input);
        expect(out.map((item) => item.value)).toEqual(['gemini-cli', 'kiro', 'qwen']);
        expect(out.map((item) => item.label)).toEqual(['Gemini CLI', 'Kiro', 'Qwen']);
    });

    it('filters empty provider ids and removes duplicates', () => {
        const input: AdminProviderCatalogItem[] = [
            { id: '', label: 'Empty', category: 'oauth', supports_models: true },
            { id: 'kiro', label: 'Kiro', category: 'oauth', supports_models: true },
            { id: 'Kiro', label: 'Kiro Duplicate', category: 'oauth', supports_models: true },
        ];

        const out = toProviderDropdownOptions(input);
        expect(out).toHaveLength(1);
        expect(out[0]).toEqual({ value: 'kiro', label: 'Kiro' });
    });

    it('falls back label to id when label is empty', () => {
        const input: AdminProviderCatalogItem[] = [
            { id: 'kilo', label: '', category: 'oauth', supports_models: true },
        ];

        const out = toProviderDropdownOptions(input);
        expect(out[0]).toEqual({ value: 'kilo', label: 'kilo' });
    });

    it('contains kiro when backend returns it', () => {
        const input: AdminProviderCatalogItem[] = [
            { id: 'codex', label: 'Codex', category: 'oauth', supports_models: true },
            { id: 'kiro', label: 'Kiro', category: 'oauth', supports_models: true },
        ];

        const out = toProviderDropdownOptions(input);
        expect(out.some((item) => item.value === 'kiro')).toBe(true);
    });
});
