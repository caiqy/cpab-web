import i18n from '../i18n';

export const API_BASE_URL =
    typeof window === 'undefined'
        ? ''
        : import.meta.env.DEV
            ? 'http://127.0.0.1:8318'
            : window.location.origin;

export const TOKEN_KEY_FRONT = 'front_token';
export const TOKEN_KEY_ADMIN = 'admin_token';
export const USER_KEY_FRONT = 'front_user';
export const USER_KEY_ADMIN = 'admin_user';

export class APIRequestError extends Error {
    status: number;
    code?: string;
    payload?: unknown;

    constructor(message: string, status: number, code?: string, payload?: unknown) {
        super(message);
        this.name = 'APIRequestError';
        this.status = status;
        this.code = code;
        this.payload = payload;
    }
}

function resolveAPIErrorMessage(errorData: any, status: number): string {
    const code = typeof errorData?.code === 'string' ? errorData.code : undefined;
    if (code === 'daily_max_usage_exceeded') {
        return i18n.t('Daily max prepaid spend exceeded');
    }
    if (typeof errorData?.error === 'string' && errorData.error.trim()) {
        return errorData.error;
    }
    return `Request failed with status ${status}`;
}

export async function apiFetchFront<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    const token = localStorage.getItem(TOKEN_KEY_FRONT);
    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY_FRONT);
        localStorage.removeItem(USER_KEY_FRONT);
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = resolveAPIErrorMessage(errorData, response.status);
        const code = typeof (errorData as any)?.code === 'string' ? (errorData as any).code : undefined;
        throw new APIRequestError(message, response.status, code, errorData);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
    }

    return response.json();
}

export async function apiFetchAdmin<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    const token = localStorage.getItem(TOKEN_KEY_ADMIN);
    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY_ADMIN);
        localStorage.removeItem(USER_KEY_ADMIN);
        window.location.href = '/admin/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = resolveAPIErrorMessage(errorData, response.status);
        const code = typeof (errorData as any)?.code === 'string' ? (errorData as any).code : undefined;
        throw new APIRequestError(message, response.status, code, errorData);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
    }

    return response.json();
}

export const apiFetch = apiFetchFront;
