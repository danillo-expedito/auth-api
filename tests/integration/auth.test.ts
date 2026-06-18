import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { userRepository } from '../../src/repositories/user.repository';
import { mockUser, mockDate } from '../../src/services/fixtures/user.fixtures';
vi.mock('../../src/repositories/user.repository');

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
            password: 'senha_encriptada_hash',
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

    it('should return 200 and a JWT token when valid credentials are provided', async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

        const response = await request(app).post('/auth/login').send({
            email: 'leon@email.com',
            password: 'Password123@',
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.token).toMatch(
            /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
        );
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
