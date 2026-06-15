import { rateLimit } from 'express-rate-limit';

export const createRateLimiter = (options: {
    windowMs: number;
    limit: number;
}) => {
    return rateLimit({
        windowMs: options.windowMs,
        limit: options.limit,
        message: {
            message:
                'Ultrapassou o limite de tentativas a partir deste IP. Por favor, tente novamente mais tarde.',
        },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
    });
};
