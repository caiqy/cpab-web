import { describe, expect, it } from 'vitest';

import { formatThinkingVariantDisplay } from './TransactionsTable';

describe('TransactionsTable variant display', () => {
    it('显示无显式推理参数为 -', () => {
        expect(formatThinkingVariantDisplay('', '')).toBe('-');
    });

    it('显示未降级场景为单值', () => {
        expect(formatThinkingVariantDisplay('xhigh', 'xhigh')).toBe('xhigh');
    });

    it('显示降级场景为 origin => real', () => {
        expect(formatThinkingVariantDisplay('xhigh', 'high')).toBe('xhigh => high');
    });
});
