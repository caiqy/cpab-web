import { render, screen } from '@testing-library/react';
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
    buildAdminPermissionKey('POST', '/v0/admin/auth-files'),
    buildAdminPermissionKey('POST', '/v0/admin/tokens/get-auth-status'),
    buildAdminPermissionKey('POST', '/v0/admin/tokens/github-copilot'),
];

describe('AdminAuthFiles device code retention', () => {
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

    it('keeps start device code when polling wait payload omits code fields', async () => {
        const apiFetchAdminSpy = vi.spyOn(apiConfig, 'apiFetchAdmin').mockImplementation(async (endpoint) => {
            if (endpoint === '/v0/admin/auth-files') {
                return { auth_files: [] } as never;
            }
            if (endpoint === '/v0/admin/tokens/github-copilot') {
                return {
                    state: 'state-1',
                    verification_uri: 'https://github.com/login/device',
                    user_code: 'ABCD-EFGH',
                } as never;
            }
            if (endpoint.startsWith('/v0/admin/tokens/get-auth-status?state=state-1')) {
                return { status: 'wait' } as never;
            }
            throw new Error(`Unexpected endpoint: ${endpoint}`);
        });

        const user = userEvent.setup();
        render(
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AdminAuthFiles />
                </MemoryRouter>
            </I18nextProvider>
        );

        await user.click(await screen.findByRole('button', { name: /New/i }));
        await user.click(await screen.findByRole('button', { name: 'GitHub Copilot' }));

        expect(await screen.findByText('Use this code to complete sign-in')).toBeInTheDocument();
        expect(screen.getAllByDisplayValue('https://github.com/login/device').length).toBeGreaterThan(0);
        expect(screen.getByDisplayValue('ABCD-EFGH')).toBeInTheDocument();

        expect(apiFetchAdminSpy).toHaveBeenCalledWith('/v0/admin/tokens/github-copilot', { method: 'POST' });
    });
});
