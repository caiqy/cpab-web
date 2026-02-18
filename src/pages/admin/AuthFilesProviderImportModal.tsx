import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { apiFetchAdmin } from '../../api/config';
import { Icon } from '../../components/Icon';
import { copyText } from '../../utils/copy';
import {
    type ProviderImportKey,
    PROVIDER_IMPORT_OPTIONS,
    PROVIDER_IMPORT_TEMPLATES,
} from './providerImportTemplates';
import { buildProviderImportPayload, parseEntriesFromJsonText } from './providerImportSchema';

type ImportTab = 'file' | 'text' | 'example';

interface ProviderImportFailure {
    index: number;
    key?: string;
    error: string;
}

interface ProviderImportResponse {
    imported: number;
    failed: ProviderImportFailure[];
}

interface ProviderImportAuthGroup {
    id: number;
    name: string;
    is_default: boolean;
}

interface AuthFilesProviderImportModalProps {
    open: boolean;
    authGroups: ProviderImportAuthGroup[];
    canListGroups: boolean;
    onClose: () => void;
    onImported: () => Promise<void> | void;
    onToast?: (message: string) => void;
}

async function parseEntriesFromFiles(files: File[]) {
    const entries: Record<string, unknown>[] = [];

    for (const file of files) {
        const text = await file.text();
        const parsed = parseEntriesFromJsonText(text);
        if (parsed.error) {
            return {
                entries: [] as Record<string, unknown>[],
                error: `${file.name}: ${parsed.error}`,
            };
        }
        entries.push(...parsed.entries);
    }

    return { entries };
}

export function AuthFilesProviderImportModal({
    open,
    authGroups,
    canListGroups,
    onClose,
    onImported,
    onToast,
}: AuthFilesProviderImportModalProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ImportTab>('file');
    const [provider, setProvider] = useState<ProviderImportKey>('codex');
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<ProviderImportResponse | null>(null);

    const providerTemplateText = useMemo(() => {
        return JSON.stringify(PROVIDER_IMPORT_TEMPLATES[provider], null, 2);
    }, [provider]);

    useEffect(() => {
        if (!open) {
            return;
        }
        setActiveTab('file');
        setProvider('codex');
        setFiles([]);
        setDragging(false);
        setTextInput('');
        setSubmitting(false);
        setError('');
        setResult(null);

        const defaultGroup = authGroups.find((group) => group.is_default);
        setSelectedGroupId(defaultGroup ? defaultGroup.id : null);
    }, [authGroups, open]);

    if (!open) {
        return null;
    }

    const addFiles = (incoming: FileList | File[]) => {
        const next = Array.from(incoming).filter((file) => file.name.toLowerCase().endsWith('.json'));
        if (next.length === 0) {
            setError(t('Only JSON files are supported.'));
            return;
        }
        setError('');
        setFiles((prev) => {
            const dedup = new Map<string, File>();
            for (const file of prev) {
                dedup.set(`${file.name}-${file.size}`, file);
            }
            for (const file of next) {
                dedup.set(`${file.name}-${file.size}`, file);
            }
            return Array.from(dedup.values());
        });
    };

    const handleImport = async () => {
        if (submitting) {
            return;
        }

        setError('');
        setResult(null);

        let entries: Record<string, unknown>[] = [];
        if (activeTab === 'file') {
            if (files.length === 0) {
                setError(t('Please select at least one JSON file.'));
                return;
            }
            const parsed = await parseEntriesFromFiles(files);
            if (parsed.error) {
                setError(parsed.error);
                return;
            }
            entries = parsed.entries;
        } else if (activeTab === 'text') {
            const parsed = parseEntriesFromJsonText(textInput);
            if (parsed.error) {
                setError(parsed.error);
                return;
            }
            entries = parsed.entries;
        } else {
            setError(t('Please switch to file or text tab to import.'));
            return;
        }

        if (entries.length === 0) {
            setError(t('No valid entries to import.'));
            return;
        }

        const payload = buildProviderImportPayload({
            provider,
            source: activeTab,
            authGroupIDs: selectedGroupId ? [selectedGroupId] : [],
            entries,
        });

        setSubmitting(true);
        try {
            const res = await apiFetchAdmin<ProviderImportResponse>('/v0/admin/auth-files/import-by-provider', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setResult(res);
            if (res.imported > 0) {
                await onImported();
                if (res.failed.length === 0) {
                    onClose();
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('Failed to import auth files.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyTemplate = async () => {
        const copied = await copyText(providerTemplateText, { source: 'AuthFilesProviderImportModal.copyTemplate' });
        if (copied.status === 'success' || copied.status === 'fallback') {
            onToast?.(t('Copied'));
        }
    };

    const tabButtonClass = (tab: ImportTab) =>
        `px-3 py-2 text-sm rounded-lg border transition-colors ${
            activeTab === tab
                ? 'bg-primary text-white border-primary'
                : 'bg-gray-50 dark:bg-background-dark border-gray-300 dark:border-border-dark text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
        }`;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark shrink-0">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Import Auth Files (Provider)')}</h2>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="inline-flex h-8 w-8 items-center justify-center text-gray-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('Provider')}
                            </label>
                            <select
                                value={provider}
                                onChange={(event) => {
                                    setProvider(event.target.value as ProviderImportKey);
                                    setResult(null);
                                    setError('');
                                }}
                                className="block w-full p-2.5 text-sm text-slate-900 dark:text-white bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg"
                            >
                                {PROVIDER_IMPORT_OPTIONS.map((option) => (
                                    <option key={option.key} value={option.key}>
                                        {t(option.label)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {canListGroups && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Auth Group')}
                                </label>
                                <select
                                    value={selectedGroupId ?? ''}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setSelectedGroupId(value ? Number(value) : null);
                                    }}
                                    className="block w-full p-2.5 text-sm text-slate-900 dark:text-white bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg"
                                >
                                    <option value="">{t('Default')}</option>
                                    {authGroups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button type="button" className={tabButtonClass('file')} onClick={() => setActiveTab('file')}>
                            {t('File Import')}
                        </button>
                        <button type="button" className={tabButtonClass('text')} onClick={() => setActiveTab('text')}>
                            {t('Text Import')}
                        </button>
                        <button type="button" className={tabButtonClass('example')} onClick={() => setActiveTab('example')}>
                            {t('Provider Example')}
                        </button>
                    </div>

                    {activeTab === 'file' && (
                        <div className="space-y-3">
                            <div
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setDragging(true);
                                }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    setDragging(false);
                                    if (event.dataTransfer?.files) {
                                        addFiles(event.dataTransfer.files);
                                    }
                                }}
                                className={`border-2 border-dashed rounded-xl p-6 transition-colors ${
                                    dragging
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-dark'
                                }`}
                            >
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <Icon name="file_upload" size={28} className="text-gray-400" />
                                    <p className="text-sm text-slate-700 dark:text-gray-300">{t('Drag and drop JSON files here')}</p>
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('provider-import-file-input')?.click()}
                                        className="mt-2 inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                                    >
                                        {t('Browse files')}
                                    </button>
                                    <input
                                        id="provider-import-file-input"
                                        type="file"
                                        multiple
                                        accept=".json,application/json"
                                        className="hidden"
                                        onChange={(event) => {
                                            if (event.target.files) {
                                                addFiles(event.target.files);
                                            }
                                            event.target.value = '';
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="max-h-40 overflow-y-auto divide-y divide-gray-200 dark:divide-border-dark border border-gray-200 dark:border-border-dark rounded-lg">
                                {files.length > 0 ? (
                                    files.map((file) => (
                                        <div key={`${file.name}-${file.size}`} className="flex items-center justify-between px-3 py-2">
                                            <div className="text-sm text-slate-900 dark:text-white truncate" title={file.name}>
                                                {file.name}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFiles((prev) => prev.filter((item) => !(item.name === file.name && item.size === file.size)));
                                                }}
                                                className="inline-flex h-8 w-8 items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-background-dark transition-colors"
                                            >
                                                <Icon name="close" size={18} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-text-secondary">{t('No files selected yet.')}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <div className="space-y-3">
                            <textarea
                                value={textInput}
                                onChange={(event) => {
                                    setTextInput(event.target.value);
                                    setError('');
                                }}
                                placeholder={t('Paste JSON object or array here')}
                                className="block w-full h-72 p-3 text-sm font-mono text-slate-900 dark:text-white bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg focus:ring-primary focus:border-primary"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const parsed = parseEntriesFromJsonText(textInput);
                                        if (parsed.error) {
                                            setError(parsed.error);
                                            return;
                                        }
                                        setTextInput(JSON.stringify(parsed.entries.length === 1 ? parsed.entries[0] : parsed.entries, null, 2));
                                    }}
                                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-border-dark text-slate-900 dark:text-white bg-gray-100 dark:bg-background-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {t('Format JSON')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTextInput('')}
                                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-border-dark text-slate-900 dark:text-white bg-gray-100 dark:bg-background-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {t('Clear')}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'example' && (
                        <div className="space-y-3">
                            <pre className="w-full h-72 overflow-auto p-3 text-xs text-slate-900 dark:text-white bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg">
                                {providerTemplateText}
                            </pre>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTextInput(providerTemplateText);
                                        setActiveTab('text');
                                        setError('');
                                    }}
                                    className="px-3 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                                >
                                    {t('Fill to Text Import')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopyTemplate}
                                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-border-dark text-slate-900 dark:text-white bg-gray-100 dark:bg-background-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {t('Copy Example')}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

                    {result && (
                        <div className="space-y-2 text-sm text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-border-dark rounded-lg p-3">
                            <div>{t('Imported {{count}} auth files', { count: result.imported })}</div>
                            {result.failed.length > 0 && (
                                <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                                    <div className="text-xs font-medium text-red-600 dark:text-red-400">
                                        {t('Some entries failed to import.')}
                                    </div>
                                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                        {result.failed.map((item) => (
                                            <div key={`${item.index}-${item.error}`} className="text-xs text-red-600 dark:text-red-400">
                                                #{item.index}
                                                {item.key ? ` (${item.key})` : ''}: {item.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-border-dark shrink-0">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-background-dark text-slate-900 dark:text-white border border-gray-300 dark:border-border-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                    >
                        {t('Cancel')}
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={submitting || activeTab === 'example'}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? t('Importing...') : t('Import')}
                    </button>
                </div>
            </div>
        </div>
    );
}
