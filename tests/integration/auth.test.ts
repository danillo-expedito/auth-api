import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../../src/routes/auth.routes';
import { userRepository } from '../../src/repositories/user.repository';
import { Prisma } from '../../src/generated/prisma';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

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
        const prismaError = new Prisma.PrismaClientKnownRequestError(
            'Unique constraint failed on the fields: (`email`)',
            {
                code: 'P2002',
                clientVersion: '5.0.0',
            },
        );

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
        vi.mocked(userRepository.create).mockRejectedValue(prismaError);

        const response = await request(app).post('/auth/register').send({
            name: 'Rafaela Silva',
            email: 'rsilva@email.com',
            password: 'A1234567@',
        });

        expect(response.status).toBe(409);
        expect(response.body).toStrictEqual({
            message: 'Este e-mail já se encontra registrado.',
        });
    });

    it('should return 201 and user data without password on success', async () => {
        const mockDate = new Date('2026-06-15T12:00:00.000Z');
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
