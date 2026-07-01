import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
    password: z
        .string()
        .min(8, 'A senha deve possuir no mínimo 8 caracteres')
        .regex(/[A-Z]/, 'A senha deve possuir ao menos uma letra maiúscula')
        .regex(/[0-9]/, 'A senha deve possuir ao menos um número')
        .regex(
            /[^a-zA-Z0-9]/,
            'A senha deve ter ao menos um caractere especial',
        ),
});

export const loginSchema = z.object({
    email: z
        .string()
        .regex(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Formato de e-mail inválido.',
        ),
    password: z.string().min(1, 'A senha é obrigatória'),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'O refresh token é obrigatório.'),
});

const createValidationMiddleware = (
    schema: z.ZodSchema,
    errorMessage: string,
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: errorMessage,
                errors: result.error.issues.map((err) => ({
                    campo: err.path.join(''),
                    mensagem: err.message,
                })),
            });
        }
        return next();
    };
};

export const validateRegister = createValidationMiddleware(
    registerSchema,
    'Dados de registro inválidos.',
);

export const validateLogin = createValidationMiddleware(
    loginSchema,
    'Dados de login inválidos.',
);

export const validateRefresh = createValidationMiddleware(
    refreshSchema,
    'Dados de renovação inválidos.',
);

export const validateLogout = createValidationMiddleware(
    refreshSchema,
    'Dados de logout inválidos.',
);
