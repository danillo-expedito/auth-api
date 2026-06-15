import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './user.service';
import { userRepository } from '../repositories/user.repository';
import bcrypt from 'bcryptjs';

vi.mock('../repositories/user.repository');

describe('UserService - registerUser (Unit Test)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Should successfully register a new user and encrypt the password', async () => {
        const mockDate = new Date('2026-06-15T12:00:00.000Z');

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

        vi.mocked(userRepository.create).mockResolvedValue({
            id: 'uuid-789',
            name: 'Silmara Passos',
            email: 'silmara@email.com',
            password: 'senha_encriptada',
            createdAt: mockDate,
            updatedAt: mockDate,
        });

        const result = await userService.registerUser(
            'Silmara Passos',
            'silmara@email.com',
            'Password123@',
        );

        expect(result).toStrictEqual({
            id: 'uuid-789',
            name: 'Silmara Passos',
            email: 'silmara@email.com',
            createdAt: mockDate,
            updatedAt: mockDate,
        });
    });

    it('should throw an error "e-mail already in use" if email already exists', async () => {
        const mockDate = new Date();

        vi.mocked(userRepository.findByEmail).mockResolvedValue({
            id: 'uuid-existente',
            name: 'Utilizador Antigo',
            email: 'marta@email.com',
            password: 'hash',
            createdAt: mockDate,
            updatedAt: mockDate,
        });

        await expect(
            userService.registerUser(
                'Marta Silva',
                'marta@email.com',
                'Password123@',
            ),
        ).rejects.toThrow('Este e-mail está registrado em outra conta.');

        expect(userRepository.create).not.toHaveBeenCalled();
    });
});
