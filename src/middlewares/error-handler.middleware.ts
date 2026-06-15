import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ZodError } from 'zod';

const isPrismaKnownError = (err: unknown): err is { code: string } => {
    return typeof err === 'object' && err !== null && 'code' in err;
};

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message,
        });
    }

    if (err instanceof ZodError) {
        const errorMessages = err.issues.map((e) => ({
            field: e.path[0],
            message: e.message,
        }));
        return res.status(400).json({ errors: errorMessages });
    }

    if (isPrismaKnownError(err) && err.code === 'P2002') {
        return res.status(409).json({
            message: 'Este e-mail está registrado em outra conta.',
        });
    }

    console.error('💥 Unexpected Error:', err);

    return res.status(500).json({
        message: 'Internal server error',
    });
};
