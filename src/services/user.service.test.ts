import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './user.service';
import { userRepository } from '../repositories/user.repository';
import {
    mockUser,
    mockDate,
    unauthorizedError,
} from './fixtures/user.fixtures';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../repositories/user.repository');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

describe('UserService - registerUser (Unit Test)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
    });

    it('Should successfully register a new user and encrypt the password', async () => {
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
        await expect(
            userService.registerUser(
                'Victor silva',
                'leon@email.com',
                'Password123@',
            ),
        ).rejects.toThrow('Este e-mail está registrado em outra conta.');

        expect(userRepository.create).not.toHaveBeenCalled();
    });
});

describe('UserService - loginUser (Unit Test)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

        vi.mocked(
            bcrypt.compare as (data: string, hash: string) => Promise<boolean>,
        ).mockResolvedValue(true);

        vi.mocked(
            jwt.sign as (
                payload: object,
                secret: string,
                options: object,
            ) => string,
        ).mockReturnValue('fake-token');
    });

    it('should return a token when credentials are valid', async () => {
        const result = await userService.loginUser(
            'leon@email.com',
            'password123',
        );

        expect(result).toBe('fake-token');
        expect(userRepository.findByEmail).toHaveBeenCalledWith(
            'leon@email.com',
        );
        expect(bcrypt.compare).toHaveBeenCalledWith(
            'password123',
            mockUser.password,
        );

        expect(jwt.sign).toHaveBeenCalledWith(
            { id: mockUser.id },
            expect.any(String),
            expect.any(Object),
        );
    });

    it('should throw UnauthorizedError when email does not exist', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

        await expect(
            userService.loginUser('arthur@email.com', 'password123'),
        ).rejects.toMatchObject(unauthorizedError);
    });

    it('should throw UnauthorizedError when password is incorrect', async () => {
        vi.mocked(
            bcrypt.compare as (data: string, hash: string) => Promise<boolean>,
        ).mockResolvedValue(false);

        await expect(
            userService.loginUser('leon@email.com', 'senha_errada'),
        ).rejects.toMatchObject(unauthorizedError);
    });

    it('should call bcrypt.compare even when user does not exist', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

        await expect(
            userService.loginUser('inexistente@email.com', 'senha-aleatoria'),
        ).rejects.toMatchObject(unauthorizedError);

        expect(bcrypt.compare).toHaveBeenCalledOnce();
    });
});
