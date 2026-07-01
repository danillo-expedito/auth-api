import { Request, Response, NextFunction, Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
    validateForgotPassword,
    validateLogin,
    validateLogout,
    validateRefresh,
    validateRegister,
    validateResetPassword,
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

const passwordResetLimiter = isTest
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : createRateLimiter({ limit: 3, windowMs: 15 * 60 * 1000 });

router.post(
    '/register',
    registerLimiter,
    validateRegister,
    authController.createUser,
);

router.post('/login', loginLimiter, validateLogin, authController.login);

router.post('/refresh', loginLimiter, validateRefresh, authController.refresh);

router.post('/logout', loginLimiter, validateLogout, authController.logout);

router.post(
    '/forgot-password',
    passwordResetLimiter,
    validateForgotPassword,
    authController.forgotPassword,
);

router.post(
    '/reset-password',
    passwordResetLimiter,
    validateResetPassword,
    authController.resetPassword,
);

export default router;
