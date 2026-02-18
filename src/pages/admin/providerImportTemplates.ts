export type ProviderImportKey =
    | 'codex'
    | 'anthropic'
    | 'gemini-cli'
    | 'antigravity'
    | 'qwen'
    | 'kiro'
    | 'iflow-cookie';

export interface ProviderImportOption {
    key: ProviderImportKey;
    label: string;
    canonicalType: string;
}

export const PROVIDER_IMPORT_OPTIONS: ProviderImportOption[] = [
    { key: 'codex', label: 'Codex', canonicalType: 'codex' },
    { key: 'anthropic', label: 'Anthropic', canonicalType: 'claude' },
    { key: 'gemini-cli', label: 'Gemini CLI', canonicalType: 'gemini' },
    { key: 'antigravity', label: 'Antigravity', canonicalType: 'antigravity' },
    { key: 'qwen', label: 'Qwen', canonicalType: 'qwen' },
    { key: 'kiro', label: 'Kiro', canonicalType: 'kiro' },
    { key: 'iflow-cookie', label: 'iFlow', canonicalType: 'iflow' },
];

export const PROVIDER_IMPORT_TEMPLATES: Record<ProviderImportKey, Record<string, unknown>> = {
    codex: {
        key: 'codex-main',
        type: 'codex',
        access_token: '<access_token>',
        refresh_token: '<refresh_token>',
        email: 'you@example.com',
    },
    anthropic: {
        key: 'claude-main',
        type: 'claude',
        access_token: '<access_token>',
        refresh_token: '<refresh_token>',
        email: 'you@example.com',
    },
    'gemini-cli': {
        key: 'gemini-main',
        type: 'gemini',
        access_token: '<access_token>',
        refresh_token: '<refresh_token>',
        email: 'you@example.com',
        project_id: '<gcp_project_id>',
    },
    antigravity: {
        key: 'antigravity-main',
        type: 'antigravity',
        access_token: '<access_token>',
        refresh_token: '<refresh_token>',
        email: 'you@example.com',
    },
    qwen: {
        key: 'qwen-main',
        type: 'qwen',
        access_token: '<access_token>',
        refresh_token: '<refresh_token>',
        email: 'you@example.com',
    },
    kiro: {
        key: 'kiro-main',
        type: 'kiro',
        access_token: '<access_token>',
        refresh_token: '<refresh_token>',
        auth_method: 'builder-id',
        email: 'you@example.com',
    },
    'iflow-cookie': {
        key: 'iflow-main',
        type: 'iflow',
        api_key: '<api_key>',
        access_token: '<access_token>',
        refresh_token: '<refresh_token>',
        email: 'you@example.com',
    },
};
