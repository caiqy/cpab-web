import { describe, expect, it } from 'vitest';

import { formatThinkingVariantDisplay } from './AdminTransactionsTable';

describe('AdminTransactionsTable variant display', () => {
    it('显示无显式推理参数为 -', () => {
        expect(formatThinkingVariantDisplay('', '')).toBe('-');
    });

    it('显示未降级场景为单值', () => {
        expect(formatThinkingVariantDisplay('high', 'high')).toBe('high');
    });

    it('显示降级场景为 origin => real', () => {
        expect(formatThinkingVariantDisplay('xhigh', 'high')).toBe('xhigh => high');
    });
});
