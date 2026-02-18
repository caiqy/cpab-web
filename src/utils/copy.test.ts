import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText } from './copy';
import * as copyFallbackBus from './copyFallbackBus';

describe('copyText', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    const setExecCommand = (result: boolean) => {
        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            writable: true,
            value: vi.fn().mockReturnValue(result),
        });
        return vi.mocked(document.execCommand);
    };

    it('uses clipboard API when available', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(globalThis.navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });

        const result = await copyText('hello', { source: 'test.clipboard' });

        expect(writeText).toHaveBeenCalledWith('hello');
        expect(result).toMatchObject({ status: 'success', method: 'clipboard' });
    });

    it('falls back to execCommand when clipboard path fails', async () => {
        const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
        const execSpy = setExecCommand(true);
        Object.defineProperty(globalThis.navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });

        const result = await copyText('hello', { source: 'test.exec' });

        expect(writeText).toHaveBeenCalledWith('hello');
        expect(execSpy).toHaveBeenCalledWith('copy');
        expect(result).toMatchObject({ status: 'success', method: 'execCommand' });
    });

    it('returns manual fallback when both auto paths fail', async () => {
        const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
        setExecCommand(false);
        const emitSpy = vi.spyOn(copyFallbackBus, 'emitCopyFallback');
        Object.defineProperty(globalThis.navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });
        Object.defineProperty(window, 'isSecureContext', {
            value: false,
            configurable: true,
        });

        const result = await copyText('hello', { source: 'test.manual' });

        expect(result).toMatchObject({
            status: 'fallback',
            method: 'manual',
            reason: 'insecure_context',
        });
        expect(emitSpy).toHaveBeenCalledWith({ text: 'hello', source: 'test.manual' });
    });
});
