import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminTransactionsTable } from './AdminTransactionsTable';
import { apiFetchAdmin } from '../../api/config';

vi.mock('../../api/config', () => ({
    apiFetchAdmin: vi.fn(),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

const mockedApiFetchAdmin = vi.mocked(apiFetchAdmin);

function createDeferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('AdminTransactionsTable request log', () => {
    beforeEach(() => {
        mockedApiFetchAdmin.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders request log icon button', async () => {
        mockedApiFetchAdmin.mockResolvedValueOnce({
            transactions: [
                {
                    id: 1,
                    request_id: 'req-1',
                    username: 'alice',
                    status: 'ok',
                    status_type: 'success',
                    timestamp: '2026-02-21T10:00:00Z',
                    provider: 'openai',
                    model: 'gpt-5',
                    variant_origin: 'high',
                    variant: 'high',
                    request_time_ms: 1200,
                    input_tokens: 10,
                    cached_tokens: 2,
                    output_tokens: 8,
                    cost_micros: 1234,
                },
            ],
            total: 1,
            page: 1,
            page_size: 10,
        });

        render(<AdminTransactionsTable />);

        expect(await screen.findByLabelText('Request log')).toBeInTheDocument();
    });

    it('requests request-log endpoint and shows error text on failure', async () => {
        const user = userEvent.setup();

        mockedApiFetchAdmin
            .mockResolvedValueOnce({
                transactions: [
                    {
                        id: 1,
                        request_id: 'req-1',
                        username: 'alice',
                        status: 'ok',
                        status_type: 'success',
                        timestamp: '2026-02-21T10:00:00Z',
                        provider: 'openai',
                        model: 'gpt-5',
                        variant_origin: 'high',
                        variant: 'high',
                        request_time_ms: 1200,
                        input_tokens: 10,
                        cached_tokens: 2,
                        output_tokens: 8,
                        cost_micros: 1234,
                    },
                ],
                total: 1,
                page: 1,
                page_size: 10,
            })
            .mockRejectedValueOnce(new Error('mock request log failed'));

        render(<AdminTransactionsTable />);

        const requestLogButtons = await screen.findAllByLabelText('Request log');
        await user.click(requestLogButtons[0]);

        await waitFor(() => {
            expect(mockedApiFetchAdmin).toHaveBeenCalledWith(
                '/v0/admin/dashboard/transactions/1/request-log'
            );
        });

        expect(await screen.findByText('mock request log failed')).toBeInTheDocument();
    });

    it('shows request and response text when request-log succeeds', async () => {
        const user = userEvent.setup();

        mockedApiFetchAdmin
            .mockResolvedValueOnce({
                transactions: [
                    {
                        id: 1,
                        request_id: 'req-1',
                        username: 'alice',
                        status: 'ok',
                        status_type: 'success',
                        timestamp: '2026-02-21T10:00:00Z',
                        provider: 'openai',
                        model: 'gpt-5',
                        variant_origin: 'high',
                        variant: 'high',
                        request_time_ms: 1200,
                        input_tokens: 10,
                        cached_tokens: 2,
                        output_tokens: 8,
                        cost_micros: 1234,
                    },
                ],
                total: 1,
                page: 1,
                page_size: 10,
            })
            .mockResolvedValueOnce({
                api_request_raw: { foo: 'bar' },
                api_response_raw: { ok: true },
            });

        render(<AdminTransactionsTable />);

        await user.click(await screen.findByLabelText('Request log'));

        expect(await screen.findByText('Request')).toBeInTheDocument();
        expect(await screen.findByText('Response')).toBeInTheDocument();
        expect(await screen.findByText(/"foo": "bar"/)).toBeInTheDocument();
        expect(await screen.findByText(/"ok": true/)).toBeInTheDocument();
    });

    it('adds dialog accessibility attributes and supports Esc close with focus restore', async () => {
        const user = userEvent.setup();

        mockedApiFetchAdmin
            .mockResolvedValueOnce({
                transactions: [
                    {
                        id: 1,
                        request_id: 'req-1',
                        username: 'alice',
                        status: 'ok',
                        status_type: 'success',
                        timestamp: '2026-02-21T10:00:00Z',
                        provider: 'openai',
                        model: 'gpt-5',
                        variant_origin: 'high',
                        variant: 'high',
                        request_time_ms: 1200,
                        input_tokens: 10,
                        cached_tokens: 2,
                        output_tokens: 8,
                        cost_micros: 1234,
                    },
                ],
                total: 1,
                page: 1,
                page_size: 10,
            })
            .mockResolvedValueOnce({ api_request_raw: { x: 1 }, api_response_raw: { y: 2 } });

        render(<AdminTransactionsTable />);

        const trigger = (await screen.findAllByLabelText('Request log'))[0];
        await user.click(trigger);

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby');

        const closeButton = screen.getByLabelText('Close');
        await waitFor(() => expect(closeButton).toHaveFocus());

        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
        expect(trigger).toHaveFocus();
    });

    it('prevents stale request-log responses from overriding latest click', async () => {
        const user = userEvent.setup();
        const firstLog = createDeferred<{ api_request_raw: unknown; api_response_raw: unknown }>();
        const secondLog = createDeferred<{ api_request_raw: unknown; api_response_raw: unknown }>();

        mockedApiFetchAdmin
            .mockResolvedValueOnce({
                transactions: [
                    {
                        id: 1,
                        request_id: 'req-1',
                        username: 'alice',
                        status: 'ok',
                        status_type: 'success',
                        timestamp: '2026-02-21T10:00:00Z',
                        provider: 'openai',
                        model: 'gpt-5',
                        variant_origin: 'high',
                        variant: 'high',
                        request_time_ms: 1200,
                        input_tokens: 10,
                        cached_tokens: 2,
                        output_tokens: 8,
                        cost_micros: 1234,
                    },
                    {
                        id: 2,
                        request_id: 'req-2',
                        username: 'bob',
                        status: 'ok',
                        status_type: 'success',
                        timestamp: '2026-02-21T10:01:00Z',
                        provider: 'openai',
                        model: 'gpt-5',
                        variant_origin: 'high',
                        variant: 'high',
                        request_time_ms: 1000,
                        input_tokens: 9,
                        cached_tokens: 1,
                        output_tokens: 7,
                        cost_micros: 1000,
                    },
                ],
                total: 2,
                page: 1,
                page_size: 10,
            })
            .mockImplementationOnce(() => firstLog.promise)
            .mockImplementationOnce(() => secondLog.promise);

        render(<AdminTransactionsTable />);

        const triggers = await screen.findAllByLabelText('Request log');
        await user.click(triggers[0]);
        await user.click(triggers[1]);

        secondLog.resolve({ api_request_raw: 'second request', api_response_raw: 'second response' });
        expect(await screen.findByText('second request')).toBeInTheDocument();
        expect(await screen.findByText('second response')).toBeInTheDocument();

        firstLog.resolve({ api_request_raw: 'first request', api_response_raw: 'first response' });

        await waitFor(() => {
            expect(screen.queryByText('first request')).not.toBeInTheDocument();
            expect(screen.queryByText('first response')).not.toBeInTheDocument();
        });
    });

    it('shows list load error message when transaction list request fails', async () => {
        mockedApiFetchAdmin.mockRejectedValueOnce(new Error('list load failed'));

        render(<AdminTransactionsTable />);

        expect(await screen.findByText('list load failed')).toBeInTheDocument();
    });
});
