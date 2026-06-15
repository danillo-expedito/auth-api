import { vi } from 'vitest';
import { UserRepository } from '../user.repository';

export const userRepository: UserRepository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
};
