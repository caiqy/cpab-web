import { describe, expect, it } from 'vitest';

import {
    beginEditPresetRequest,
    buildAuthFileUpdatePayload,
    canApplyEditPresetRequest,
    deriveWhitelistCapability,
    invalidateEditPresetRequest,
    resolveAuthFileWhitelistForSave,
    resolveWhitelistReason,
} from './AuthFiles';

const t = (key: string) => {
    const dict: Record<string, string> = {
        'Auth type is required for whitelist presets.': 'AUTH_TYPE_REQUIRED',
        'Whitelist is not supported for this auth type.': 'UNSUPPORTED_AUTH_TYPE',
        'Provider models are temporarily unavailable for this auth type.': 'PROVIDER_MODELS_UNAVAILABLE',
    };
    return dict[key] || key;
};

describe('AuthFiles whitelist helpers', () => {
    it('builds whitelist payload with allowed models', () => {
        const payload = buildAuthFileUpdatePayload({
            name: 'auth-a',
            key: 'auth-a',
            isAvailable: true,
            proxyUrl: '',
            rateLimit: 0,
            priority: 0,
            whitelistEnabled: true,
            allowedModels: ['claude-sonnet-4-6', ' claude-sonnet-4-6 ', 'claude-opus-4-1'],
        });

        expect(payload.whitelist_enabled).toBe(true);
        expect(payload.allowed_models).toEqual(['claude-opus-4-1', 'claude-sonnet-4-6']);
    });

    it('omits whitelist fields when includeWhitelistFields is false', () => {
        const payload = buildAuthFileUpdatePayload({
            name: 'auth-a',
            key: 'auth-a',
            isAvailable: true,
            proxyUrl: '',
            rateLimit: 0,
            priority: 0,
            includeWhitelistFields: false,
            whitelistEnabled: true,
            allowedModels: ['claude-opus-4-1'],
        });

        expect(payload).not.toHaveProperty('whitelist_enabled');
        expect(payload).not.toHaveProperty('allowed_models');
    });

    it('returns disabled capability when presets unsupported', () => {
        const capability = deriveWhitelistCapability({
            supported: false,
            reason_code: 'unsupported_auth_type',
            reason: 'unsupported auth type',
            models: ['claude-sonnet-4-6'],
        });

        expect(capability.supported).toBe(false);
        expect(capability.disabled).toBe(true);
        expect(capability.reasonCode).toBe('unsupported_auth_type');
        expect(capability.reason).toBe('unsupported auth type');
        expect(capability.models).toEqual(['claude-sonnet-4-6']);
    });

    it('prefers reason_code localization over raw reason', () => {
        const reason = resolveWhitelistReason(
            {
                reason_code: 'whitelist_not_supported',
                reason: 'whitelist not supported for provider x',
            },
            t
        );

        expect(reason).toBe('UNSUPPORTED_AUTH_TYPE');
    });

    it('falls back to raw reason when reason_code is unknown', () => {
        const reason = resolveWhitelistReason(
            {
                reason_code: 'custom_backend_reason',
                reason: 'custom backend reason',
            },
            t
        );

        expect(reason).toBe('custom backend reason');
    });

    it('falls back to raw reason when translation is missing', () => {
        const reason = resolveWhitelistReason(
            {
                reason_code: 'unsupported_auth_type',
                reason: 'backend unsupported reason',
            },
            () => 'Whitelist is not supported for this auth type.'
        );

        expect(reason).toBe('backend unsupported reason');
    });

    it('only allows latest edit preset request to apply', () => {
        const firstRequestId = beginEditPresetRequest(0);
        const secondRequestId = beginEditPresetRequest(firstRequestId);

        expect(canApplyEditPresetRequest(secondRequestId, firstRequestId)).toBe(false);
        expect(canApplyEditPresetRequest(secondRequestId, secondRequestId)).toBe(true);
    });

    it('invalidates pending edit preset request on modal close', () => {
        const requestId = beginEditPresetRequest(0);
        const invalidatedId = invalidateEditPresetRequest(requestId);

        expect(canApplyEditPresetRequest(invalidatedId, requestId)).toBe(false);
    });

    it('keeps fallback whitelist values when whitelist settings are untouched', () => {
        const resolved = resolveAuthFileWhitelistForSave({
            editWhitelistSupported: true,
            editWhitelistDirty: false,
            editWhitelistEnabled: true,
            editAllowedModels: ['new-model'],
            fallbackWhitelistEnabled: true,
            fallbackAllowedModels: ['old-model'],
        });

        expect(resolved.whitelistEnabled).toBe(true);
        expect(resolved.allowedModels).toEqual(['old-model']);
    });

    it('uses edited whitelist values when whitelist settings are touched', () => {
        const resolved = resolveAuthFileWhitelistForSave({
            editWhitelistSupported: true,
            editWhitelistDirty: true,
            editWhitelistEnabled: true,
            editAllowedModels: ['new-model'],
            fallbackWhitelistEnabled: true,
            fallbackAllowedModels: ['old-model'],
        });

        expect(resolved.whitelistEnabled).toBe(true);
        expect(resolved.allowedModels).toEqual(['new-model']);
    });
});
