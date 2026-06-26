import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { userRepository } from '../../src/repositories/user.repository';
import { mockUser, mockDate } from '../../src/services/fixtures/user.fixtures';
import jwt from 'jsonwebtoken';
import { refreshTokenRepository } from '../../src/repositories/refresh-token.repository';

vi.mock('../../src/repositories/user.repository');
vi.mock('../../src/repositories/refresh-token.repository');

describe('POST /auth/register - Validation Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if the email is invalid', async () => {
        const response = await request(app).post('/auth/register').send({
            name: 'Arthur Morgan',
            email: 'email-invalido',
            password: 'Password123@',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty(
            'message',
            'Dados de registro inválidos.',
        );
        expect(response.body.errors[0].campo).toBe('email');
    });

    it('should return 400 if the password is too short', async () => {
        const response = await request(app).post('/auth/register').send({
            name: 'Arthur Morgan',
            email: 'red@email.com',
            password: '1234@',
        });

        expect(response.status).toBe(400);
        expect(
            response.body.errors.some((err: any) =>
                err.mensagem.includes('mínimo 8 caracteres'),
            ),
        ).toBe(true);
    });

    it('should return 400 if the password doesnt have a uppercase caracter', async () => {
        const response = await request(app).post('/auth/register').send({
            name: 'Arthur Morgan',
            email: 'red@email.com',
            password: '1234678@',
        });

        expect(response.status).toBe(400);
        expect(
            response.body.errors.some((err: any) =>
                err.mensagem.includes('letra maiúscula'),
            ),
        ).toBe(true);
    });

    it('should return 400 if the password doesnt have a especial caracter', async () => {
        const response = await request(app).post('/auth/register').send({
            name: 'Arthur Morgan',
            email: 'red@email.com',
            password: 'A1234567',
        });

        expect(response.status).toBe(400);
        expect(
            response.body.errors.some((err: any) =>
                err.mensagem.includes('caractere especial'),
            ),
        ).toBe(true);
    });

    it('should return 400 if the name is too short', async () => {
        const response = await request(app).post('/auth/register').send({
            name: 'A',
            email: 'red@email.com',
            password: 'A1234567@',
        });

        expect(response.status).toBe(400);
        expect(response.body.errors[0].campo).toBe('name');
    });

    it('should return 409 if the email is already registered', async () => {
        const mockedPrismaError = {
            message: 'Unique constraint failed',
            code: 'P2002',
        };

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
        vi.mocked(userRepository.create).mockRejectedValue(mockedPrismaError);

        const response = await request(app).post('/auth/register').send({
            name: 'Rafaela Silva',
            email: 'rsilva@email.com',
            password: 'A1234567@',
        });

        expect(response.status).toBe(409);
        expect(response.body).toStrictEqual({
            message: 'Este e-mail está registrado em outra conta.',
        });
    });

    it('should return 201 and user data without password on success', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

        vi.mocked(userRepository.create).mockResolvedValue({
            name: 'Arthur Morgan',
            email: 'red@email.com',
            passwordHash: 'senha_encriptada_hash',
            id: 'uuid-1234',
            createdAt: mockDate,
            updatedAt: mockDate,
        });

        const response = await request(app).post('/auth/register').send({
            name: 'Arthur Morgan',
            email: 'red@email.com',
            password: 'A1234567@',
        });

        expect(response.status).toBe(201);
        expect(response.body).toStrictEqual({
            id: expect.any(String),
            name: 'Arthur Morgan',
            email: 'red@email.com',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
        });

        expect(response.body.passwordHash).toBeUndefined();
        expect(response.body.password).toBeUndefined();
    });
});

describe('POST /auth/login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 200, an access token, and a refresh token when valid credentials are provided', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

        const response = await request(app).post('/auth/login').send({
            email: 'leon@email.com',
            password: 'Password123@',
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');

        const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        expect(response.body.accessToken).toMatch(jwtRegex);
        expect(response.body.refreshToken).toMatch(jwtRegex);
    });

    it('should return 401 when the email does not exist in the database', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

        const response = await request(app).post('/auth/login').send({
            email: 'azura@email.com',
            password: 'Password123@',
        });

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
            message: 'Invalid credentials',
        });
    });

    it('should return 401 when the password is incorrect', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

        const response = await request(app).post('/auth/login').send({
            email: 'leon@email.com',
            password: 'Wrongpassword123',
        });

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
            message: 'Invalid credentials',
        });
    });

    it('should return 400 when the email format is invalid (Zod)', async () => {
        const response = await request(app).post('/auth/login').send({
            email: 'leon-emailcom',
            password: 'Password123@',
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Dados de login inválidos.');
        expect(response.body.errors[0].campo).toBe('email');
    });

    it('should return 400 when the password field is missing from the payload (Zod)', async () => {
        const response = await request(app).post('/auth/login').send({
            email: 'leon@email.com',
            password: '',
        });

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            errors: [
                {
                    campo: 'password',
                    mensagem: 'A senha é obrigatória',
                },
            ],
            message: 'Dados de login inválidos.',
        });
    });
});

describe('GET /auth/me - Protected User Profile Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 200 and user data when a valid token is provided', async () => {
        const token = jwt.sign(
            { id: mockUser.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' },
        );

        vi.mocked(userRepository.findById).mockResolvedValue(mockUser);

        const response = await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            createdAt: mockDate.toISOString(),
            updatedAt: mockDate.toISOString(),
        });
    });

    it('should return 401 when the token is not provided in the headers', async () => {
        const response = await request(app).get('/users/me');

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
            message: 'Token não fornecido.',
        });
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('should return 401 when the provided token is invalid or expired', async () => {
        const response = await request(app)
            .get('/users/me')
            .set('Authorization', 'Bearer token-invalido');

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
            message: 'Token inválido ou expirado',
        });
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('should return 404 when the user encoded in the token no longer exists in the database', async () => {
        const token = jwt.sign(
            { id: 'uuid-aleatorio' },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' },
        );

        vi.mocked(userRepository.findById).mockResolvedValue(null);

        const response = await request(app)
            .get('/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body).toStrictEqual({
            message: 'Usuário não encontrado.',
        });
    });
});

describe('POST /auth/refresh', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(refreshTokenRepository.create).mockResolvedValue({
            id: 'token-id',
            token: 'fake-token',
            userId: mockUser.id,
            expiresAt: new Date(),
            revoked: false,
            createdAt: new Date(),
        });
    });

    it('should return 200 and a new access token when a valid refresh token is provided', async () => {
        const validRefreshToken = jwt.sign(
            { id: mockUser.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' },
        );

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 5);

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
            id: 'token-uuid-123',
            token: validRefreshToken,
            userId: mockUser.id,
            expiresAt: futureDate,
            revoked: false,
            createdAt: mockDate,
            user: mockUser,
        });

        const response = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken: validRefreshToken });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');

        const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        expect(response.body.accessToken).toMatch(jwtRegex);
    });

    it('should return 401 when the refresh token is invalid, expired, or revoked', async () => {
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null);

        const response = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken: 'token-inexistente-ou-adulterado' });

        expect(response.status).toBe(401);
        expect(response.body).toStrictEqual({
            message: 'Token inválido ou expirado.',
        });
    });

    it('should return 400 when the refresh token field is missing from the payload (Zod)', async () => {
        const response = await request(app).post('/auth/refresh').send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Dados de renovação inválidos.');
        expect(response.body.errors[0].campo).toBe('refreshToken');
    });
});
