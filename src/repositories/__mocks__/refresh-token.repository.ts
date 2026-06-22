import { vi } from 'vitest';
import { RefreshTokenRepository } from '../refresh-token.repository';

export const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn(),
    findByToken: vi.fn(),
    revoke: vi.fn(),
};
