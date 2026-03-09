import { describe, expect, it } from 'vitest';

import { extractCopilotItemsForTest } from './Quotas';

describe('extractCopilotItemsForTest', () => {
    it('maps premium_interactions to 高级请求 and shows remaining/entitlement', () => {
        const payload = {
            quota_snapshots: {
                premium_interactions: {
                    entitlement: 300,
                    percent_remaining: 77.06,
                    quota_id: 'premium_interactions',
                    remaining: 231,
                    timestamp_utc: '2026-03-09T09:09:27.924Z',
                    unlimited: false,
                },
            },
        };

        const items = extractCopilotItemsForTest(payload, '2026-03-09T10:00:00Z', 'zh-CN', (key) => {
            if (key === 'Premium Interactions') {
                return '高级请求';
            }
            return key;
        });
        expect(items).not.toBeNull();
        const premium = (items || []).find((item) => item.name === '高级请求');
        expect(premium).toBeDefined();
        expect(premium?.percent).toBeCloseTo(77.06, 2);
        expect(premium?.amountDisplay).toBe('231 / 300');
        expect(premium?.updatedAt).toBe('2026-03-09T09:09:27.924Z');
    });
});
