export interface CopilotQuotaItem {
    name: string;
    percent: number | null;
    updatedAt: string | null;
    amountDisplay?: string;
}

export type CopilotQuotaTranslator = (key: string, options?: { [key: string]: unknown }) => string;

export function extractCopilotQuotaItems(
    payload: unknown,
    fallbackTime: string,
    locale: string,
    t: CopilotQuotaTranslator
): CopilotQuotaItem[] | null {
    const normalized = normalizePayload(payload);
    if (!normalized || typeof normalized !== 'object') {
        return null;
    }
    const snapshots = toRecord((normalized as Record<string, unknown>).quota_snapshots);
    if (!snapshots) {
        return null;
    }

    const orderedKeys = ['chat', 'completions', 'premium_interactions'];
    const otherKeys = Object.keys(snapshots).filter((key) => !orderedKeys.includes(key));
    const keys = [...orderedKeys.filter((key) => key in snapshots), ...otherKeys.sort()];

    const items: CopilotQuotaItem[] = [];
    for (const key of keys) {
        const record = toRecord(snapshots[key]);
        if (!record) {
            continue;
        }

        const quotaIDRaw = toStringValue(record.quota_id);
        const percentRemaining = toNumber(record.percent_remaining);
        const remaining = toNumber(record.remaining);
        const entitlement = toNumber(record.entitlement);
        const hasMinimalQuotaShape =
            quotaIDRaw !== '' || percentRemaining !== null || (remaining !== null && entitlement !== null);
        if (!hasMinimalQuotaShape) {
            continue;
        }

        const quotaID = quotaIDRaw || key;
        const displayName = quotaID === 'premium_interactions' ? t('Premium Interactions') : quotaID;

        let percent: number | null = null;
        if (percentRemaining !== null) {
            percent = normalizePercent(percentRemaining);
        } else if (remaining !== null && entitlement !== null && entitlement > 0) {
            percent = normalizePercent((remaining / entitlement) * 100);
        }

        const timestamp = toStringValue(record.timestamp_utc) || fallbackTime;
        const updatedAt = formatQuotaTime(timestamp, locale) ? timestamp : null;

        let amountDisplay: string | undefined;
        if (quotaID === 'premium_interactions') {
            const unlimited = normalizeBoolean(record.unlimited) === true;
            if (unlimited && (entitlement === null || entitlement <= 0)) {
                amountDisplay = t('Unlimited');
            } else if (remaining !== null && entitlement !== null && entitlement >= 0) {
                amountDisplay = `${formatQuotaAmount(remaining)} / ${formatQuotaAmount(entitlement)}`;
            }
        }

        items.push({
            name: displayName,
            percent,
            updatedAt,
            amountDisplay,
        });
    }

    return items.length > 0 ? items : null;
}

function normalizePayload(data: unknown): unknown {
    if (typeof data !== 'string') {
        return data;
    }
    const trimmed = data.trim();
    if (!trimmed) {
        return data;
    }
    const startsJSON = trimmed.startsWith('{') && trimmed.endsWith('}');
    const startsArray = trimmed.startsWith('[') && trimmed.endsWith(']');
    if (!startsJSON && !startsArray) {
        return data;
    }
    try {
        return JSON.parse(trimmed);
    } catch {
        return data;
    }
}

function toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function toStringValue(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return '';
}

function normalizePercent(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }
    const normalized = value <= 1 ? value * 100 : value;
    return Math.min(100, Math.max(0, normalized));
}

function normalizeBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim().toLowerCase();
        if (trimmed === 'true' || trimmed === '1') {
            return true;
        }
        if (trimmed === 'false' || trimmed === '0') {
            return false;
        }
    }
    return null;
}

function formatQuotaTime(value: string | null, locale: string): string {
    if (!value) {
        return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const formatter = new Intl.DateTimeFormat(locale || undefined, {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
    return formatter.format(date);
}

function formatQuotaAmount(value: number): string {
    if (!Number.isFinite(value)) {
        return '0';
    }
    if (Math.abs(value - Math.round(value)) < 1e-6) {
        return String(Math.round(value));
    }
    return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}
