export interface ManualCopyPayload {
    text: string;
    source: string;
}

const COPY_FALLBACK_EVENT = 'cpab:manual-copy-fallback';

export function emitCopyFallback(payload: ManualCopyPayload): void {
    if (typeof window === 'undefined') {
        return;
    }
    window.dispatchEvent(new CustomEvent<ManualCopyPayload>(COPY_FALLBACK_EVENT, { detail: payload }));
}

export function subscribeCopyFallback(listener: (payload: ManualCopyPayload) => void): () => void {
    if (typeof window === 'undefined') {
        return () => {
            // no-op
        };
    }

    const handler = (event: Event) => {
        const detail = (event as CustomEvent<ManualCopyPayload>).detail;
        if (!detail || typeof detail.text !== 'string') {
            return;
        }
        listener(detail);
    };

    window.addEventListener(COPY_FALLBACK_EVENT, handler as EventListener);
    return () => {
        window.removeEventListener(COPY_FALLBACK_EVENT, handler as EventListener);
    };
}
