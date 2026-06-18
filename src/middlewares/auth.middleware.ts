import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { AppError } from '../errors/AppError';

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Token não fornecido.');
        }

        const token = authHeader.split(' ')[1] as string;

        const decoded = jwt.verify(token, JWT_SECRET) as unknown as {
            id: string;
        };
        req.user = { id: decoded.id };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        next(new UnauthorizedError('Token inválido ou expirado'));
    }
};
