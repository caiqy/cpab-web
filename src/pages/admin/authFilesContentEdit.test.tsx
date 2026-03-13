import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    content: { type: 'claude', access_token: 'old-token' },
    whitelist_enabled: false,
    allowed_models: [],
    excluded_models: [],
    is_available: true,
    rate_limit: 0,
    priority: 0,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
};

type SetupOptions = {
    content?: unknown;
    putReject?: boolean;
};

async function openEditModal(options?: SetupOptions) {
    const setupOptions = options;
    const putBodies: Record<string, unknown>[] = [];
    const authFile = {
        ...BASE_AUTH_FILE,
        ...(setupOptions?.content !== undefined ? { content: setupOptions.content } : null),
    };

    vi.spyOn(apiConfig, 'apiFetchAdmin').mockImplementation(async (endpoint, requestOptions) => {
        if (endpoint === '/v0/admin/auth-files') {
            return { auth_files: [authFile] } as never;
        }
        if (endpoint === '/v0/admin/auth-files/model-presets?type=claude') {
            return {
                supported: false,
                reason: '',
                reason_code: 'unsupported_auth_type',
                models: [],
            } as never;
        }
        if (endpoint === '/v0/admin/auth-files/1' && requestOptions?.method === 'PUT') {
            putBodies.push(JSON.parse(String(requestOptions.body || '{}')));
            if (setupOptions?.putReject) {
                throw new Error('PUT failed');
            }
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

    const editButtons = await screen.findAllByTitle('Edit');
    await user.click(editButtons[0]);

    return {
        user,
        putBodies,
        saveButton: await screen.findByRole('button', { name: 'Save' }),
        contentInput: await screen.findByLabelText('Content (JSON)'),
    };
}

describe('AdminAuthFiles content editor in edit modal', () => {
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

    afterEach(() => {
        cleanup();
    });

    it('shows formatted content JSON after opening edit modal', async () => {
        const { contentInput } = await openEditModal();

        expect(screen.getByText('Content (JSON)')).toBeInTheDocument();
        expect(contentInput).toHaveValue(`{
  "type": "claude",
  "access_token": "old-token"
}`);
    });

    it('sends edited content with existing managed fields on save', async () => {
        const { user, putBodies, saveButton, contentInput } = await openEditModal();

        fireEvent.change(contentInput, {
            target: { value: '{"type":"claude","access_token":"new-token","region":"us"}' },
        });
        await user.click(saveButton);

        await waitFor(() => expect(putBodies).toHaveLength(1));
        expect(putBodies[0]).toMatchObject({
            name: 'auth-a',
            key: 'auth-a',
            proxy_url: '',
            rate_limit: 0,
            priority: 0,
            content: {
                type: 'claude',
                access_token: 'new-token',
                region: 'us',
            },
        });
    });

    it('shows invalid JSON error and keeps save disabled for malformed input', async () => {
        const { user, putBodies, saveButton, contentInput } = await openEditModal();

        fireEvent.change(contentInput, { target: { value: '{' } });

        expect(screen.getByText('Content must be valid JSON.')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
        expect(putBodies).toHaveLength(0);

        await user.click(saveButton);
        expect(putBodies).toHaveLength(0);
    });

    it('shows non-object JSON error and keeps save disabled for array input', async () => {
        const { user, putBodies, saveButton, contentInput } = await openEditModal();

        fireEvent.change(contentInput, { target: { value: '[]' } });

        expect(screen.getByText('Content must be a JSON object.')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
        expect(putBodies).toHaveLength(0);

        await user.click(saveButton);
        expect(putBodies).toHaveLength(0);
    });

    it('shows conflict error and keeps save disabled when content has proxy_url', async () => {
        const { user, putBodies, saveButton, contentInput } = await openEditModal();

        fireEvent.change(contentInput, { target: { value: '{"proxy_url":"http://conflict"}' } });

        expect(screen.getByText('proxy_url must be edited with the dedicated form field.')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
        expect(putBodies).toHaveLength(0);

        await user.click(saveButton);
        expect(putBodies).toHaveLength(0);
    });

    it('shows initial conflict error and keeps save disabled for legacy proxy_url in content', async () => {
        const { user, putBodies, saveButton } = await openEditModal({
            content: { type: 'claude', proxy_url: 'http://legacy' },
        });

        expect(screen.getByText('proxy_url must be edited with the dedicated form field.')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
        expect(putBodies).toHaveLength(0);

        await user.click(saveButton);
        expect(putBodies).toHaveLength(0);
    });

    it('keeps array content text and immediately shows non-object error on open', async () => {
        const { user, putBodies, saveButton, contentInput } = await openEditModal({ content: [] });

        expect(contentInput).toHaveValue('[]');
        expect(screen.getByText('Content must be a JSON object.')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
        expect(putBodies).toHaveLength(0);

        await user.click(saveButton);
        expect(putBodies).toHaveLength(0);
    });

    it('keeps null content text and immediately shows non-object error on open', async () => {
        const { user, putBodies, saveButton, contentInput } = await openEditModal({ content: null });

        expect(contentInput).toHaveValue('null');
        expect(screen.getByText('Content must be a JSON object.')).toBeInTheDocument();
        expect(saveButton).toBeDisabled();
        expect(putBodies).toHaveLength(0);

        await user.click(saveButton);
        expect(putBodies).toHaveLength(0);
    });

    it('keeps modal open, preserves input, and shows submit error when update fails', async () => {
        const { user, putBodies, saveButton, contentInput } = await openEditModal({ putReject: true });

        const editedValue = '{"type":"claude","access_token":"failed-token"}';
        fireEvent.change(contentInput, { target: { value: editedValue } });

        await user.click(saveButton);

        await waitFor(() => expect(putBodies).toHaveLength(1));
        expect(await screen.findByText('Failed to update auth file.')).toBeInTheDocument();
        expect(screen.getByLabelText('Content (JSON)')).toHaveValue(editedValue);
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('shows updated content after successful save when reopening edit modal', async () => {
        const { user, saveButton, contentInput } = await openEditModal();

        fireEvent.change(contentInput, {
            target: { value: '{"type":"claude","access_token":"new-token","region":"eu"}' },
        });
        await user.click(saveButton);

        await waitFor(() => {
            expect(screen.queryByLabelText('Content (JSON)')).not.toBeInTheDocument();
        });

        const editButtons = await screen.findAllByTitle('Edit');
        await user.click(editButtons[0]);

        const reopenedContentInput = await screen.findByLabelText('Content (JSON)');
        expect(reopenedContentInput).toHaveValue(`{
  "type": "claude",
  "access_token": "new-token",
  "region": "eu"
}`);
    });
});
