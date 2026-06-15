import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

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

export const validateRegister = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Dados de registro inválidos.',
                errors: result.error.issues.map((err) => ({
                    campo: err.path.join(''),
                    mensagem: err.message,
                })),
            });
        }
        return next();
    } catch (error) {
        return res.status(500).json({ message: 'Erro interno na validação.' });
    }
};
