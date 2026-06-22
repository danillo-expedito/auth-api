import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { UnauthorizedError } from '../errors/UnauthorizedError';

export class UserController {
    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return next(new UnauthorizedError('Não autorizado.'));
            }
            const { id } = req.user;

            const user = await userService.getMe(id);

            return res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController();
