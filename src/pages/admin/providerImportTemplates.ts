export type ProviderImportKey =
    | 'codex'
    | 'anthropic'
    | 'gemini-cli'
    | 'antigravity'
    | 'qwen'
    | 'kiro'
    | 'kimi'
    | 'github-copilot'
    | 'kilo'
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
    { key: 'kimi', label: 'Kimi', canonicalType: 'kimi' },
    { key: 'github-copilot', label: 'GitHub Copilot', canonicalType: 'github-copilot' },
    { key: 'kilo', label: 'Kilo', canonicalType: 'kilo' },
    { key: 'iflow-cookie', label: 'iFlow', canonicalType: 'iflow' },
];

export const PROVIDER_IMPORT_TEMPLATES: Record<ProviderImportKey, Record<string, unknown>> = {
    codex: {
        access_token: '<access_token>',
        email: 'you@example.com',
        refresh_token: '<refresh_token_optional>',
    },
    anthropic: {
        access_token: '<access_token>',
        email: 'you@example.com',
        refresh_token: '<refresh_token_optional>',
    },
    'gemini-cli': {
        access_token: '<access_token>',
        token: {
            access_token: '<access_token_optional_alternative>',
        },
        project_id: '<gcp_project_id>',
        email: 'you@example.com',
    },
    antigravity: {
        access_token: '<access_token>',
        email: 'you@example.com',
        refresh_token: '<refresh_token_optional>',
    },
    qwen: {
        access_token: '<access_token>',
        email: 'you@example.com',
        refresh_token: '<refresh_token_optional>',
    },
    kiro: {
        access_token: '<access_token>',
        refresh_token: '<refresh_token_optional>',
        auth_method: 'builder-id',
        email: 'you@example.com',
    },
    kimi: {
        access_token: '<kimi_access_token>',
    },
    'github-copilot': {
        access_token: '<github_copilot_access_token>',
    },
    kilo: {
        access_token: '<kilo_access_token>',
    },
    'iflow-cookie': {
        _mode_a_api_key: {
            api_key: '<api_key>',
        },
        _mode_b_cookie: {
            cookie: 'BXAuth=<cookie>',
            email: 'you@example.com',
        },
        _mode_c_oauth: {
            refresh_token: '<refresh_token>',
            access_token: '<access_token_optional>',
        },
        api_key: '<api_key>',
    },
};
