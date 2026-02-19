export interface TokenStartResponse {
    state: string;
    url?: string;
    method?: string;
    verification_url?: string;
    verification_uri?: string;
    user_code?: string;
}

export interface AuthStatusResponse {
    status: 'ok' | 'wait' | 'error' | 'device_code' | 'auth_url';
    error?: string;
    verification_url?: string;
    user_code?: string;
    url?: string;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || undefined;
}

export function mergeDeviceCodeField(
    currentValue: string | undefined,
    incomingValue: string | undefined
): string | undefined {
    return normalizeOptionalText(incomingValue) || normalizeOptionalText(currentValue);
}

export function hasDeviceCodeData(verificationUrl?: string, userCode?: string): boolean {
    return !!(normalizeOptionalText(verificationUrl) || normalizeOptionalText(userCode));
}

export function normalizeTokenStartResponse(input: unknown): TokenStartResponse {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid token response');
    }
    const raw = input as Record<string, unknown>;
    const state = typeof raw.state === 'string' ? raw.state.trim() : '';
    if (!state) {
        throw new Error('Token response missing state');
    }
    const url = typeof raw.url === 'string' ? raw.url.trim() : '';
    const method = typeof raw.method === 'string' ? raw.method.trim() : '';
    const verificationUrl = typeof raw.verification_url === 'string' ? raw.verification_url.trim() : '';
    const verificationURI = typeof raw.verification_uri === 'string' ? raw.verification_uri.trim() : '';
    const userCode = typeof raw.user_code === 'string' ? raw.user_code.trim() : '';

    const normalizedVerificationURL = verificationUrl || verificationURI || undefined;
    const normalizedVerificationURI = verificationURI || verificationUrl || undefined;

    return {
        state,
        url: url || undefined,
        method: method || undefined,
        verification_url: normalizedVerificationURL,
        verification_uri: normalizedVerificationURI,
        user_code: userCode || undefined,
    };
}

export function normalizeAuthStatusResponse(input: unknown): AuthStatusResponse {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid auth status response');
    }
    const raw = input as Record<string, unknown>;
    const statusRaw = typeof raw.status === 'string' ? raw.status.trim() : '';
    if (!statusRaw) {
        throw new Error('Invalid auth status response');
    }
    if (!['ok', 'wait', 'error', 'device_code', 'auth_url'].includes(statusRaw)) {
        throw new Error('Invalid auth status response');
    }

    const error = typeof raw.error === 'string' ? raw.error.trim() : '';
    const verificationUrl = typeof raw.verification_url === 'string' ? raw.verification_url.trim() : '';
    const userCode = typeof raw.user_code === 'string' ? raw.user_code.trim() : '';
    const url = typeof raw.url === 'string' ? raw.url.trim() : '';

    return {
        status: statusRaw as AuthStatusResponse['status'],
        error: error || undefined,
        verification_url: verificationUrl || undefined,
        user_code: userCode || undefined,
        url: url || undefined,
    };
}
