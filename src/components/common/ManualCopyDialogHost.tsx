import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyText } from '../../utils/copy';
import { subscribeCopyFallback, type ManualCopyPayload } from '../../utils/copyFallbackBus';
import { Icon } from '../Icon';

function getCopyShortcutHint(): string {
    const platform = typeof navigator !== 'undefined' ? navigator.platform.toLowerCase() : '';
    return platform.includes('mac') ? 'Cmd+C' : 'Ctrl+C';
}

export function ManualCopyDialogHost() {
    const { t } = useTranslation();
    const [payload, setPayload] = useState<ManualCopyPayload | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const shortcut = useMemo(() => getCopyShortcutHint(), []);

    useEffect(() => {
        return subscribeCopyFallback((nextPayload) => {
            setPayload(nextPayload);
        });
    }, []);

    useEffect(() => {
        if (!payload || !textareaRef.current) {
            return;
        }
        textareaRef.current.focus();
        textareaRef.current.select();
    }, [payload]);

    const close = () => {
        setPayload(null);
    };

    const handleRetryAutoCopy = async () => {
        if (!payload) {
            return;
        }
        const result = await copyText(payload.text, {
            source: `${payload.source}.retry`,
        });
        if (result.status === 'success') {
            close();
        }
    };

    if (!payload) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
            <div className="w-full max-w-xl mx-4 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {t('Copy switched to manual mode')}
                    </h2>
                    <button
                        type="button"
                        onClick={close}
                        className="inline-flex h-8 w-8 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                        aria-label={t('Close')}
                    >
                        <Icon name="close" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('Press Ctrl/Cmd+C to copy')} ({shortcut})
                    </p>
                    <textarea
                        ref={textareaRef}
                        readOnly
                        value={payload.text}
                        rows={5}
                        className="w-full rounded-lg border border-gray-300 dark:border-border-dark bg-gray-50 dark:bg-background-dark px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                    />
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-border-dark">
                    <button
                        type="button"
                        onClick={close}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-100 dark:bg-background-dark text-slate-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t('Close')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            void handleRetryAutoCopy();
                        }}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white transition-colors"
                    >
                        {t('Retry auto copy')}
                    </button>
                </div>
            </div>
        </div>
    );
}
