import { Request, Response, NextFunction, Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
    validateLogin,
    validateRefresh,
    validateRegister,
} from '../models/auth.schema';
import { createRateLimiter } from '../middlewares/rate-limiter.middleware';

const router: Router = Router();

const isTest = process.env.NODE_ENV === 'test';

const registerLimiter = isTest
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : createRateLimiter({
          limit: 5,
          windowMs: 15 * 60 * 1000,
      });

const loginLimiter = isTest
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

router.post(
    '/register',
    registerLimiter,
    validateRegister,
    authController.createUser,
);

router.post('/login', loginLimiter, validateLogin, authController.login);

router.post('/refresh', loginLimiter, validateRefresh, authController.refresh);

router.post('/logout', loginLimiter, validateRefresh, authController.logout);

export default router;
