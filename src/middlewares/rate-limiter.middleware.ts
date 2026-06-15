import { rateLimit } from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: {
        message:
            'Ultrapassou o limite de tentativas a partir deste IP. Por favor, tente novamente mais tarde.',
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
