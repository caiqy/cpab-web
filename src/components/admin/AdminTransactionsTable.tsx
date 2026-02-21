import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
import { apiFetchAdmin } from '../../api/config';
import { useTranslation } from 'react-i18next';

interface Transaction {
	id: number | string;
	request_id: string;
	username: string;
	status: string;
	status_type: 'success' | 'error';
	timestamp: string;
	provider: string;
	model: string;
	variant_origin?: string;
	variant?: string;
	request_time_ms: number;
	input_tokens: number;
	cached_tokens: number;
	output_tokens: number;
	cost_micros: number;
}

export function formatThinkingVariantDisplay(variantOrigin?: string, variant?: string): string {
	const origin = (variantOrigin ?? '').trim();
	const real = (variant ?? '').trim();
	if (!origin && !real) return '-';
	if (origin && real) {
		if (origin === real) return real;
		return `${origin} => ${real}`;
	}
	return real || origin || '-';
}

interface TransactionsData {
    transactions: Transaction[];
    total: number;
    page: number;
    page_size: number;
}

interface RequestLogData {
    api_request_raw?: unknown;
    api_response_raw?: unknown;
}

function formatTokens(tokens: number): string {
    if (tokens === 0) return '0';
    return tokens.toLocaleString();
}

function formatSecondsFromMs(ms: number | null | undefined): string {
    const value = typeof ms === 'number' && Number.isFinite(ms) ? ms : 0;
    return `${(value / 1000).toFixed(2)} s`;
}

export function AdminTransactionsTable() {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [requestLogOpen, setRequestLogOpen] = useState(false);
    const [requestLogRequest, setRequestLogRequest] = useState('');
    const [requestLogResponse, setRequestLogResponse] = useState('');
    const [requestLogError, setRequestLogError] = useState('');
    const requestLogTitleId = 'admin-transactions-request-log-title';
    const requestLogCloseButtonRef = useRef<HTMLButtonElement | null>(null);
    const requestLogTriggerButtonRef = useRef<HTMLButtonElement | null>(null);
    const activeRequestLogIdRef = useRef(0);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    useEffect(() => {
        setLoading(true);
        setListError('');
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('page_size', pageSize.toString());

        apiFetchAdmin<TransactionsData>(`/v0/admin/dashboard/transactions?${params.toString()}`)
            .then((res) => {
                setTransactions(res.transactions || []);
                setTotal(res.total ?? 0);
            })
            .catch((error) => {
                console.error(error);
                const message = error instanceof Error ? error.message : String(error);
                setListError(message);
                setTransactions([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, [page, pageSize]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = total === 0 ? 0 : Math.min(page * pageSize, total);

    const formatRawLog = (value: unknown): string => {
        if (typeof value === 'string') {
            return value || '-';
        }
        if (value === null || value === undefined) {
            return '-';
        }
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    };

    const closeRequestLog = () => {
        setRequestLogOpen(false);
        activeRequestLogIdRef.current += 1;

        const triggerButton = requestLogTriggerButtonRef.current;
        if (triggerButton) {
            window.setTimeout(() => {
                triggerButton.focus();
            }, 0);
        }
    };

    useEffect(() => {
        if (!requestLogOpen) return;

        window.setTimeout(() => {
            requestLogCloseButtonRef.current?.focus();
        }, 0);
    }, [requestLogOpen]);

    useEffect(() => {
        if (!requestLogOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeRequestLog();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [requestLogOpen]);

    const openRequestLog = (tx: Transaction, triggerButton: HTMLButtonElement) => {
        requestLogTriggerButtonRef.current = triggerButton;

        const requestId = activeRequestLogIdRef.current + 1;
        activeRequestLogIdRef.current = requestId;

        setRequestLogOpen(true);
        setRequestLogError('');
        setRequestLogRequest('');
        setRequestLogResponse('');

        apiFetchAdmin<RequestLogData>(`/v0/admin/dashboard/transactions/${tx.id}/request-log`)
            .then((res) => {
                if (requestId !== activeRequestLogIdRef.current) return;
                setRequestLogRequest(formatRawLog(res.api_request_raw));
                setRequestLogResponse(formatRawLog(res.api_response_raw));
            })
            .catch((error) => {
                if (requestId !== activeRequestLogIdRef.current) return;
                const message = error instanceof Error ? error.message : String(error);
                setRequestLogError(message);
            });
    };

	return (
		<div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-border-dark flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t('Recent Transactions')}
                </h3>
                <a
                    href="/admin/logs"
                    className="text-sm font-medium text-primary hover:text-blue-400 transition-colors"
                >
                    {t('View All Logs →')}
                </a>
            </div>
			{listError ? (
				<div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
					{listError}
				</div>
			) : null}
			<div className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead className="bg-slate-50 dark:bg-background-dark text-slate-500 dark:text-text-secondary uppercase text-xs font-semibold">
						<tr>
							<th className="px-6 py-4">{t('Username')}</th>
							<th className="px-6 py-4">{t('Status')}</th>
							<th className="px-6 py-4">{t('Timestamp')}</th>
							<th className="px-6 py-4">{t('Provider')}</th>
							<th className="px-6 py-4">{t('Model')}</th>
							<th className="px-6 py-4">{t('Request Time')}</th>
							<th className="px-6 py-4 text-right">{t('Input')}</th>
							<th className="px-6 py-4 text-right">{t('Cached')}</th>
							<th className="px-6 py-4 text-right">{t('Output')}</th>
							<th className="px-6 py-4">{t('Cost')}</th>
							<th className="px-6 py-4 text-center">{t('Request log')}</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 dark:divide-border-dark">
						{loading ? (
							[...Array(5)].map((_, i) => (
								<tr key={i}>
									<td colSpan={11} className="px-6 py-4">
										<div className="animate-pulse h-4 bg-slate-200 dark:bg-border-dark rounded"></div>
									</td>
								</tr>
							))
						) : transactions.length === 0 ? (
							<tr>
								<td colSpan={11} className="px-6 py-8 text-center text-slate-500 dark:text-text-secondary">
									{t('No transactions yet')}
								</td>
							</tr>
						) : (
							transactions.map((tx, index) => (
								<tr
									key={tx.id || `${tx.request_id}-${index}`}
									className="hover:bg-slate-50 dark:hover:bg-background-dark/30 transition-colors"
								>
									<td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-white">
										{tx.username || '-'}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
												tx.status_type === 'success'
													? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
													: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20'
											}`}
										>
											{tx.status}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-text-secondary font-mono text-xs">
										{tx.timestamp}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-text-secondary">
										{tx.provider || '-'}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-white font-medium">
										<div className="inline-flex items-center gap-2">
											<span>{tx.model}</span>
											<span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-200 dark:border-border-dark text-[11px] font-mono text-slate-600 dark:text-text-secondary">
												{formatThinkingVariantDisplay(tx.variant_origin, tx.variant)}
											</span>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-text-secondary font-mono">
										{formatSecondsFromMs(tx.request_time_ms)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-slate-600 dark:text-text-secondary font-mono">
										{formatTokens(Math.max(0, (tx.input_tokens ?? 0) - (tx.cached_tokens ?? 0)))}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-slate-600 dark:text-text-secondary font-mono">
										{formatTokens(tx.cached_tokens ?? 0)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-slate-600 dark:text-text-secondary font-mono">
										{formatTokens(tx.output_tokens ?? 0)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-text-secondary font-mono">
										${(tx.cost_micros / 1000000).toFixed(3)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-center">
										<button
											onClick={(event) => openRequestLog(tx, event.currentTarget)}
											aria-label="Request log"
											className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 dark:border-border-dark text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-background-dark transition-colors"
										>
											<Icon name="description" size={18} />
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<div className="px-6 py-4 border-t border-gray-200 dark:border-border-dark flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
					<div className="flex items-center gap-2">
						<span className="text-sm text-slate-500 dark:text-text-secondary">
							{t('Rows per page')}
						</span>
						<select
							value={pageSize}
							onChange={(e) => {
								const next = Number.parseInt(e.target.value, 10);
								setPageSize(Number.isFinite(next) && next > 0 ? next : 10);
								setPage(1);
							}}
							className="h-9 px-3 text-sm bg-gray-50 dark:bg-background-dark border border-gray-300 dark:border-border-dark rounded-lg text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
						>
							{[10, 15, 30, 50, 100].map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>

					<span className="text-sm text-slate-500 dark:text-text-secondary">
						{t('Showing {{from}} to {{to}} of {{total}} transactions', {
							from,
							to,
							total,
						})}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1 || loading}
						className="p-2 rounded-lg border border-gray-200 dark:border-border-dark text-slate-600 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-background-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						<Icon name="chevron_left" size={18} />
					</button>
					<span className="text-sm text-slate-600 dark:text-text-secondary px-3">
						{t('Page {{current}} of {{total}}', { current: page, total: totalPages })}
					</span>
					<button
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page === totalPages || loading}
						className="p-2 rounded-lg border border-gray-200 dark:border-border-dark text-slate-600 dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-background-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						<Icon name="chevron_right" size={18} />
					</button>
				</div>
			</div>

			{requestLogOpen ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div
						className="w-full max-w-5xl rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-xl"
						role="dialog"
						aria-modal="true"
						aria-labelledby={requestLogTitleId}
					>
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
							<h4 id={requestLogTitleId} className="text-base font-semibold text-slate-900 dark:text-white">{t('Request log')}</h4>
							<button
								ref={requestLogCloseButtonRef}
								onClick={closeRequestLog}
								aria-label={t('Close')}
								className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 dark:border-border-dark text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-background-dark transition-colors"
							>
								<Icon name="close" size={18} />
							</button>
						</div>
						<div className="p-6 space-y-4">
							{requestLogError ? (
								<div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
									{requestLogError}
								</div>
							) : null}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<div className="mb-2 text-sm font-semibold text-slate-700 dark:text-white">Request</div>
									<pre className="min-h-48 max-h-96 overflow-auto rounded-lg border border-gray-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark p-3 text-xs text-slate-700 dark:text-text-secondary whitespace-pre-wrap break-all">
										{requestLogRequest || '-'}
									</pre>
								</div>
								<div>
									<div className="mb-2 text-sm font-semibold text-slate-700 dark:text-white">Response</div>
									<pre className="min-h-48 max-h-96 overflow-auto rounded-lg border border-gray-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark p-3 text-xs text-slate-700 dark:text-text-secondary whitespace-pre-wrap break-all">
										{requestLogResponse || '-'}
									</pre>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
