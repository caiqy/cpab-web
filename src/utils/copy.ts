import { emitCopyFallback } from './copyFallbackBus';

export type CopyMethod = 'clipboard' | 'execCommand' | 'manual';
export type CopyStatus = 'success' | 'fallback' | 'failed';
export type CopyReason = 'insecure_context' | 'permission_denied' | 'api_unavailable' | 'unknown';

export interface CopyOptions {
    source: string;
}

export interface CopyResult {
    status: CopyStatus;
    method: CopyMethod;
    reason?: CopyReason;
}

function copyByExecCommand(text: string): boolean {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied;
    } catch {
        return false;
    }
}

export async function copyText(text: string, options: CopyOptions): Promise<CopyResult> {
    const value = text.trim();
    if (!value) {
        return {
            status: 'failed',
            method: 'manual',
            reason: 'api_unavailable',
        };
    }

    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return {
                status: 'success',
                method: 'clipboard',
            };
        }
    } catch {
        // Continue to fallback copy path.
    }

    if (copyByExecCommand(value)) {
        return {
            status: 'success',
            method: 'execCommand',
        };
    }

    emitCopyFallback({
        text: value,
        source: options.source,
    });

    return {
        status: 'fallback',
        method: 'manual',
        reason: window.isSecureContext ? 'permission_denied' : 'insecure_context',
    };
}
