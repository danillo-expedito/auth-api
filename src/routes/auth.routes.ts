import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRegister } from '../models/auth.schema';

const router: Router = Router();

router.post('/register', validateRegister, authController.createUser);

export default router;
