import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { ManualCopyDialogHost } from './ManualCopyDialogHost';
import i18n from '../../i18n';
import { emitCopyFallback } from '../../utils/copyFallbackBus';

describe('ManualCopyDialogHost', () => {
    it('opens dialog when fallback event is emitted and closes on click', async () => {
        const user = userEvent.setup();
        render(
            <I18nextProvider i18n={i18n}>
                <ManualCopyDialogHost />
            </I18nextProvider>
        );

        emitCopyFallback({ text: 'abc-123', source: 'test.case' });

        expect(await screen.findByText(/Press Ctrl\/Cmd\+C to copy/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('abc-123')).toBeInTheDocument();

        await user.click(screen.getByLabelText('Close'));

        expect(screen.queryByDisplayValue('abc-123')).not.toBeInTheDocument();
    });
});
