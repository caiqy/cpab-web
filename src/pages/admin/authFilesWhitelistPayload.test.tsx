import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import * as apiConfig from '../../api/config';
import { buildAdminPermissionKey } from '../../utils/adminPermissions';
import { AdminAuthFiles } from './AuthFiles';

const REQUIRED_PERMISSIONS = [
    buildAdminPermissionKey('GET', '/v0/admin/auth-files'),
    buildAdminPermissionKey('PUT', '/v0/admin/auth-files/:id'),
];

const BASE_AUTH_FILE = {
    id: 1,
    key: 'auth-a',
    name: 'auth-a',
    auth_group_id: [],
    auth_group: [],
    proxy_url: '',
    content: { type: 'claude' },
    whitelist_enabled: true,
    allowed_models: ['claude-opus-4-1'],
    excluded_models: ['claude-sonnet-4-6'],
    is_available: true,
    rate_limit: 0,
    priority: 0,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
};

describe('AdminAuthFiles whitelist save payload', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
            configurable: true,
            value: vi.fn(() =>
                ({
                    font: '',
                    measureText: () => ({ width: 120 }),
                })
            ),
        });
        localStorage.clear();
        localStorage.setItem(
            apiConfig.USER_KEY_ADMIN,
            JSON.stringify({
                permissions: REQUIRED_PERMISSIONS,
                is_super_admin: false,
            })
        );
        vi.restoreAllMocks();
    });

    it('does not send whitelist fields when whitelist controls are untouched', async () => {
        const putBodies: Record<string, unknown>[] = [];
        vi.spyOn(apiConfig, 'apiFetchAdmin').mockImplementation(async (endpoint, options) => {
            if (endpoint === '/v0/admin/auth-files') {
                return { auth_files: [BASE_AUTH_FILE] } as never;
            }
            if (endpoint === '/v0/admin/auth-files/model-presets?type=claude') {
                return {
                    provider: 'claude',
                    supported: true,
                    reason: '',
                    reason_code: '',
                    models: ['claude-opus-4-1', 'claude-sonnet-4-6'],
                } as never;
            }
            if (endpoint === '/v0/admin/auth-files/1' && options?.method === 'PUT') {
                putBodies.push(JSON.parse(String(options.body || '{}')));
                return { ok: true } as never;
            }
            throw new Error(`Unexpected endpoint: ${String(endpoint)}`);
        });

        const user = userEvent.setup();
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AdminAuthFiles />
                </MemoryRouter>
            </I18nextProvider>
        );

        await user.click(await screen.findByTitle('Edit'));
        await user.click(await screen.findByRole('button', { name: 'Save' }));

        await waitFor(() => expect(putBodies).toHaveLength(1));
        const payload = putBodies[0];
        expect(payload).not.toHaveProperty('whitelist_enabled');
        expect(payload).not.toHaveProperty('allowed_models');
    });

    it('sends whitelist fields after user touches whitelist controls', async () => {
        const putBodies: Record<string, unknown>[] = [];
        vi.spyOn(apiConfig, 'apiFetchAdmin').mockImplementation(async (endpoint, options) => {
            if (endpoint === '/v0/admin/auth-files') {
                return { auth_files: [BASE_AUTH_FILE] } as never;
            }
            if (endpoint === '/v0/admin/auth-files/model-presets?type=claude') {
                return {
                    provider: 'claude',
                    supported: true,
                    reason: '',
                    reason_code: '',
                    models: ['claude-opus-4-1', 'claude-sonnet-4-6'],
                } as never;
            }
            if (endpoint === '/v0/admin/auth-files/1' && options?.method === 'PUT') {
                putBodies.push(JSON.parse(String(options.body || '{}')));
                return { ok: true } as never;
            }
            throw new Error(`Unexpected endpoint: ${String(endpoint)}`);
        });

        const user = userEvent.setup();
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AdminAuthFiles />
                </MemoryRouter>
            </I18nextProvider>
        );

        await user.click(await screen.findByTitle('Edit'));
        const whitelistCheckbox = await screen.findByRole('checkbox', { name: 'Whitelist mode' });
        await waitFor(() => expect(whitelistCheckbox).not.toBeDisabled());
        await user.click(whitelistCheckbox);
        await user.click(await screen.findByRole('button', { name: 'Save' }));

        await waitFor(() => expect(putBodies).toHaveLength(1));
        const payload = putBodies[0];
        expect(payload).toHaveProperty('whitelist_enabled', false);
        expect(payload).toHaveProperty('allowed_models');
        expect(payload.allowed_models).toEqual([]);
    });
});
