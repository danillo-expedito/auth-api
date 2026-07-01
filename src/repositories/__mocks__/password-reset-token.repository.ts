import { vi } from 'vitest';
import { PasswordResetTokenRepository } from '../password-reset-token.repository';

export const passwordResetTokenRepository: PasswordResetTokenRepository = {
    create: vi.fn(),
    findByToken: vi.fn(),
    markAsUsed: vi.fn(),
};
