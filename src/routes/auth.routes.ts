import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRegister } from '../models/auth.schema';
import { authLimiter } from '../middlewares/rate-limiter.middleware';

const router: Router = Router();

router.post(
    '/register',
    authLimiter,
    validateRegister,
    authController.createUser,
);

export default router;
