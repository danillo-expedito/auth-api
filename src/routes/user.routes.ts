import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { userController } from '../controllers/user.controller';

const router: Router = Router();

router.get('/me', authenticate, userController.getMe);

export default router;
