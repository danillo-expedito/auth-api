import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate } from './auth.middleware';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

vi.mock('jsonwebtoken');

describe('Authentication Middleware - authenticate', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            headers: {},
        };
        res = {};
        next = vi.fn() as NextFunction;
    });
    it('should call next() when a valid token is provided', async () => {
        req.headers!.authorization = 'Bearer token-valido';

        vi.mocked(jwt.verify).mockReturnValue({ id: 'uuid-user-123' } as any);

        await authenticate(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith();
        expect(next).toHaveBeenCalledOnce();
    });

    it('should attach the correct user ID to req.user when a valid token is provided', async () => {
        req.headers!.authorization = 'Bearer token-valido';
        vi.mocked(jwt.verify).mockReturnValue({ id: 'uuid-user-123' } as any);

        await authenticate(req as Request, res as Response, next);

        expect(req.user).toStrictEqual({ id: 'uuid-user-123' });
    });

    it('should call next with UnauthorizedError when Authorization header is missing', async () => {
        req.headers!.authorization = undefined;

        await authenticate(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should call next with UnauthorizedError when token does not start with "Bearer "', async () => {
        req.headers!.authorization = 'TokenInvalido SemBearer123';

        await authenticate(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should call next with UnauthorizedError when the token is invalid', async () => {
        req.headers!.authorization = 'Bearer token-adulterado';

        vi.mocked(jwt.verify).mockImplementation(() => {
            throw new jwt.JsonWebTokenError('invalid signature');
        });

        await authenticate(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next with UnauthorizedError when the token is expired', async () => {
        req.headers!.authorization = 'Bearer token-expirado';

        vi.mocked(jwt.verify).mockImplementation(() => {
            throw new jwt.TokenExpiredError('jwt expired', new Date());
        });

        await authenticate(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});
