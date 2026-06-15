import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRegister } from '../models/auth.schema';
import { createRateLimiter } from '../middlewares/rate-limiter.middleware';

const router: Router = Router();

const registerLimiter = createRateLimiter({
    limit: 5,
    windowMs: 15 * 60 * 1000,
});
const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

router.post(
    '/register',
    registerLimiter,
    validateRegister,
    authController.createUser,
);

router.post('/login', loginLimiter, authController.login);

export default router;
