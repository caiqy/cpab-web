import type { ProviderImportKey } from './providerImportTemplates';

const COMMON_ALLOWED_FIELDS = [
    'email',
    'proxy_url',
    'prefix',
    'api_key',
    'access_token',
    'refresh_token',
    'id_token',
    'token',
    'cookie',
    'cookies',
    'bxauth',
    'base_url',
    'project_id',
    'organization_id',
    'profile_arn',
    'auth_method',
    'provider',
    'client_id',
    'client_secret',
    'expires_at',
    'expired',
    'expires_in',
    'timestamp',
    'last_refresh',
    'disable_cooling',
    'request_retry',
    'runtime_only',
    'name',
    'session_key',
] as const;

const PROVIDER_ALLOWED_FIELDS: Record<ProviderImportKey, readonly string[]> = {
    codex: COMMON_ALLOWED_FIELDS,
    anthropic: COMMON_ALLOWED_FIELDS,
    'gemini-cli': COMMON_ALLOWED_FIELDS,
    antigravity: COMMON_ALLOWED_FIELDS,
    qwen: COMMON_ALLOWED_FIELDS,
    kiro: COMMON_ALLOWED_FIELDS,
    kimi: COMMON_ALLOWED_FIELDS,
    'github-copilot': COMMON_ALLOWED_FIELDS,
    kilo: COMMON_ALLOWED_FIELDS,
    'iflow-cookie': COMMON_ALLOWED_FIELDS,
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMeaningfulValue(value: unknown): boolean {
    if (value === null || value === undefined) {
        return false;
    }
    if (typeof value === 'string') {
        return value.trim() !== '';
    }
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    if (isObjectRecord(value)) {
        return Object.keys(value).length > 0;
    }
    return true;
}

function pickFieldValue(entry: Record<string, unknown>, field: string): unknown {
    if (Object.prototype.hasOwnProperty.call(entry, field)) {
        return entry[field];
    }
    const metadata = entry.metadata;
    if (isObjectRecord(metadata) && Object.prototype.hasOwnProperty.call(metadata, field)) {
        return metadata[field];
    }
    return undefined;
}

export function parseEntriesFromJsonText(input: string): { entries: Record<string, unknown>[]; error?: string } {
    const text = input.trim();
    if (!text) {
        return { entries: [], error: 'empty json content' };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return { entries: [], error: 'invalid json' };
    }

    if (Array.isArray(parsed)) {
        if (!parsed.every((item) => isObjectRecord(item))) {
            return { entries: [], error: 'json array must contain objects' };
        }
        return { entries: parsed };
    }

    if (isObjectRecord(parsed)) {
        return { entries: [parsed] };
    }

    return { entries: [], error: 'json must be an object or array of objects' };
}

export function sanitizeEntryForProvider(
    provider: ProviderImportKey,
    entry: Record<string, unknown>
): Record<string, unknown> {
    const allowedFields = PROVIDER_ALLOWED_FIELDS[provider] ?? COMMON_ALLOWED_FIELDS;
    const sanitized: Record<string, unknown> = {};

    for (const field of allowedFields) {
        const value = pickFieldValue(entry, field);
        if (!isMeaningfulValue(value)) {
            continue;
        }
        sanitized[field] = value;
    }

    return sanitized;
}

export interface BuildProviderImportPayloadParams {
    provider: ProviderImportKey;
    source: 'file' | 'text';
    authGroupIDs: number[];
    entries: Record<string, unknown>[];
}

export function buildProviderImportPayload(params: BuildProviderImportPayloadParams): {
    provider: ProviderImportKey;
    source: 'file' | 'text';
    auth_group_id: number[];
    entries: Record<string, unknown>[];
} {
    const { provider, source, authGroupIDs, entries } = params;
    return {
        provider,
        source,
        auth_group_id: authGroupIDs,
        entries: entries.map((entry) => sanitizeEntryForProvider(provider, entry)),
    };
}
