import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import * as apiConfig from '../../api/config';
import { buildAdminPermissionKey } from '../../utils/adminPermissions';
import { AdminModels } from './Models';

const REQUIRED_PERMISSIONS = [
    buildAdminPermissionKey('GET', '/v0/admin/model-mappings'),
    buildAdminPermissionKey('GET', '/v0/admin/model-mappings/providers'),
    buildAdminPermissionKey('GET', '/v0/admin/user-groups'),
    buildAdminPermissionKey('DELETE', '/v0/admin/model-mappings/:id'),
];

const BASE_MAPPINGS = [
    {
        id: 1,
        provider: 'github-copilot',
        model_name: 'claude-opus-4.6',
        new_model_name: 'claude-opus-4-6',
        fork: true,
        selector: 0,
        rate_limit: 0,
        user_group_id: [],
        is_enabled: true,
        created_at: '2026-03-12T00:00:00Z',
        updated_at: '2026-03-12T00:00:00Z',
    },
    {
        id: 2,
        provider: 'github-copilot',
        model_name: 'claude-sonnet-4.6',
        new_model_name: 'claude-sonnet-4-6',
        fork: true,
        selector: 0,
        rate_limit: 0,
        user_group_id: [],
        is_enabled: true,
        created_at: '2026-03-12T00:00:00Z',
        updated_at: '2026-03-12T00:00:00Z',
    },
];

function renderAdminModels() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter>
                <AdminModels />
            </MemoryRouter>
        </I18nextProvider>
    );
}

describe('AdminModels bulk delete', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
            configurable: true,
            value: vi.fn(() => ({
                font: '',
                measureText: () => ({ width: 120 }),
            })),
        });
        localStorage.clear();
        localStorage.setItem(
            apiConfig.USER_KEY_ADMIN,
            JSON.stringify({
                permissions: REQUIRED_PERMISSIONS,
                is_super_admin: false,
            })
        );
    });

    it('bulk deletes selected model mappings and clears selection when all deletes succeed', async () => {
        const deleteCalls: string[] = [];
        vi.spyOn(apiConfig, 'apiFetchAdmin').mockImplementation(async (endpoint, options) => {
            if (endpoint === '/v0/admin/model-mappings') {
                return { model_mappings: BASE_MAPPINGS } as never;
            }
            if (endpoint === '/v0/admin/model-mappings/providers') {
                return {
                    providers: [{ id: 'github-copilot', label: 'GitHub Copilot', category: 'oauth', supports_models: true }],
                } as never;
            }
            if (endpoint === '/v0/admin/user-groups') {
                return { user_groups: [] } as never;
            }
            if (String(endpoint).startsWith('/v0/admin/model-mappings/') && options?.method === 'DELETE') {
                deleteCalls.push(String(endpoint));
                return {} as never;
            }
            throw new Error(`Unexpected endpoint: ${String(endpoint)}`);
        });

        const user = userEvent.setup();
        renderAdminModels();

        await screen.findByText('claude-opus-4.6');
        const rowCheckboxes = await screen.findAllByTitle('Select row');
        await user.click(rowCheckboxes[0]);
        await user.click(rowCheckboxes[1]);

        await user.click(screen.getByTitle('Bulk delete selected'));
        await user.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(deleteCalls).toHaveLength(2));
        await waitFor(() => expect(screen.queryByText('claude-opus-4.6')).not.toBeInTheDocument());
        await waitFor(() => expect(screen.queryByText('claude-sonnet-4.6')).not.toBeInTheDocument());
        await waitFor(() => expect(screen.getByTitle('Bulk delete selected')).toBeDisabled());
    });

    it('keeps failed rows selected when bulk delete partially fails', async () => {
        const deleteCalls: string[] = [];
        vi.spyOn(apiConfig, 'apiFetchAdmin').mockImplementation(async (endpoint, options) => {
            if (endpoint === '/v0/admin/model-mappings') {
                return { model_mappings: BASE_MAPPINGS } as never;
            }
            if (endpoint === '/v0/admin/model-mappings/providers') {
                return {
                    providers: [{ id: 'github-copilot', label: 'GitHub Copilot', category: 'oauth', supports_models: true }],
                } as never;
            }
            if (endpoint === '/v0/admin/user-groups') {
                return { user_groups: [] } as never;
            }
            if (endpoint === '/v0/admin/model-mappings/1' && options?.method === 'DELETE') {
                deleteCalls.push(String(endpoint));
                return {} as never;
            }
            if (endpoint === '/v0/admin/model-mappings/2' && options?.method === 'DELETE') {
                deleteCalls.push(String(endpoint));
                throw new Error('delete failed');
            }
            throw new Error(`Unexpected endpoint: ${String(endpoint)}`);
        });

        const user = userEvent.setup();
        renderAdminModels();

        await screen.findByText('claude-opus-4.6');
        const rowCheckboxes = await screen.findAllByTitle('Select row');
        await user.click(rowCheckboxes[0]);
        await user.click(rowCheckboxes[1]);

        await user.click(screen.getByTitle('Bulk delete selected'));
        await user.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(deleteCalls).toHaveLength(2));
        await waitFor(() => expect(screen.queryByText('claude-opus-4.6')).not.toBeInTheDocument());
        expect(screen.getByText('claude-sonnet-4.6')).toBeInTheDocument();

        const remainingCheckboxes = screen.getAllByTitle('Select row');
        expect(remainingCheckboxes).toHaveLength(1);
        expect(remainingCheckboxes[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('keeps bulk delete disabled when nothing is selected', async () => {
        vi.spyOn(apiConfig, 'apiFetchAdmin').mockImplementation(async (endpoint) => {
            if (endpoint === '/v0/admin/model-mappings') {
                return { model_mappings: BASE_MAPPINGS } as never;
            }
            if (endpoint === '/v0/admin/model-mappings/providers') {
                return {
                    providers: [{ id: 'github-copilot', label: 'GitHub Copilot', category: 'oauth', supports_models: true }],
                } as never;
            }
            if (endpoint === '/v0/admin/user-groups') {
                return { user_groups: [] } as never;
            }
            throw new Error(`Unexpected endpoint: ${String(endpoint)}`);
        });

        renderAdminModels();

        await screen.findByText('claude-opus-4.6');
        expect(screen.getByTitle('Bulk delete selected')).toBeDisabled();
    });
});
