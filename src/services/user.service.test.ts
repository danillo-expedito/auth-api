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
import { refreshTokenRepository } from '../repositories/refresh-token.repository';

vi.mock('../repositories/user.repository');
vi.mock('../repositories/refresh-token.repository');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

const refreshUnauthorizedError = {
    message: 'Token inválido ou expirado.',
    statusCode: 401,
};

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
            passwordHash: 'senha_encriptada',
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

        vi.mocked(refreshTokenRepository.create).mockResolvedValue({
            id: 'token-id-123',
            token: 'fake-token',
            userId: mockUser.id,
            expiresAt: new Date(),
            revoked: false,
            createdAt: new Date(),
        });
    });

    it('should return an access and refresh token when credentials are valid', async () => {
        const result = await userService.loginUser(
            'leon@email.com',
            'password123',
        );

        expect(result).toStrictEqual({
            accessToken: 'fake-token',
            refreshToken: 'fake-token',
        });

        expect(userRepository.findByEmail).toHaveBeenCalledWith(
            'leon@email.com',
        );
        expect(bcrypt.compare).toHaveBeenCalledWith(
            'password123',
            mockUser.passwordHash,
        );

        expect(jwt.sign).toHaveBeenCalledWith(
            { id: mockUser.id },
            expect.any(String),
            expect.any(Object),
        );

        expect(refreshTokenRepository.create).toHaveBeenCalledWith(
            mockUser.id,
            'fake-token',
            expect.any(Date),
        );
    });

    it('should throw UnauthorizedError when email does not exist', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

        await expect(
            userService.loginUser('arthur@email.com', 'password123'),
        ).rejects.toMatchObject(unauthorizedError);

        expect(refreshTokenRepository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when password is incorrect', async () => {
        vi.mocked(
            bcrypt.compare as (data: string, hash: string) => Promise<boolean>,
        ).mockResolvedValue(false);

        await expect(
            userService.loginUser('leon@email.com', 'senha_errada'),
        ).rejects.toMatchObject(unauthorizedError);

        expect(refreshTokenRepository.create).not.toHaveBeenCalled();
    });

    it('should call bcrypt.compare even when user does not exist', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

        await expect(
            userService.loginUser('inexistente@email.com', 'senha-aleatoria'),
        ).rejects.toMatchObject(unauthorizedError);

        expect(bcrypt.compare).toHaveBeenCalledOnce();
        expect(refreshTokenRepository.create).not.toHaveBeenCalled();
    });
});

describe('UserService - refreshUserToken (Unit Test)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(jwt.verify).mockReturnValue({ id: 'uuid-user-123' } as any);
    });

    it('should successfully return a new access token when a valid refresh token is provided', async () => {
        const futureDate = new Date(mockDate);
        futureDate.setDate(
            futureDate.setFullYear(futureDate.getFullYear() + 5),
        );

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
            id: 'token-id',
            token: 'refresh-token-valido',
            userId: 'uuid-user-123',
            expiresAt: futureDate,
            revoked: false,
            createdAt: mockDate,
            user: mockUser,
        });

        const result = await userService.refreshUserToken(
            'refresh-token-valido',
        );

        expect(result).toStrictEqual({
            accessToken: 'fake-token',
        });

        expect(refreshTokenRepository.findByToken).toHaveBeenCalledWith(
            'refresh-token-valido',
        );
    });

    it('should throw UnauthorizedError when the token is cryptographically invalid or altered', async () => {
        vi.mocked(jwt.verify).mockImplementation(() => {
            throw new jwt.JsonWebTokenError('invalid signature');
        });

        await expect(
            userService.refreshUserToken('token-adulterado'),
        ).rejects.toMatchObject(refreshUnauthorizedError);

        expect(refreshTokenRepository.findByToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when the token does not exist in the database', async () => {
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null);

        await expect(
            userService.refreshUserToken('token-inexistente'),
        ).rejects.toMatchObject(refreshUnauthorizedError);
    });

    it('should throw UnauthorizedError when the token exists but has been revoked', async () => {
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
            id: 'token-id',
            token: 'token-revogado',
            userId: 'uuid-user-123',
            expiresAt: new Date(mockDate.getTime() + 100000),
            revoked: true,
            createdAt: mockDate,
            user: mockUser,
        });

        await expect(
            userService.refreshUserToken('token-revogado'),
        ).rejects.toMatchObject(refreshUnauthorizedError);
    });

    it('should throw UnauthorizedError when the token exists but its expiration date has passed', async () => {
        const yesterday = new Date(mockDate);
        yesterday.setDate(yesterday.getDate() - 1);

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
            id: 'token-id',
            token: 'token-expirado',
            userId: 'uuid-user-123',
            expiresAt: yesterday,
            revoked: false,
            createdAt: yesterday,
            user: mockUser,
        });

        await expect(
            userService.refreshUserToken('token-expirado'),
        ).rejects.toMatchObject(refreshUnauthorizedError);
    });
});
