import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export class AuthController {
    async createUser(req: Request, res: Response, next: NextFunction) {
        const { name, email, password } = req.body;

        try {
            const newUser = await userService.registerUser(
                name,
                email,
                password,
            );
            return res.status(201).json(newUser);
        } catch (error: unknown) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        const { email, password } = req.body;

        try {
            const { accessToken, refreshToken } = await userService.loginUser(
                email,
                password,
            );

            return res.status(200).json({ accessToken, refreshToken });
        } catch (error: unknown) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        const { refreshToken } = req.body;

        try {
            await userService.logoutUser(refreshToken);

            return res.status(204).send();
        } catch (error: unknown) {
            next(error);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction) {
        const { refreshToken } = req.body;

        try {
            const { accessToken } =
                await userService.refreshUserToken(refreshToken);

            return res.status(200).json({ accessToken });
        } catch (error: unknown) {
            next(error);
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        const { email } = req.body;

        try {
            await userService.forgotPassword(email);

            return res.status(202).json({
                message:
                    'Se o e-mail estiver registrado, você receberá instruções para redefinir sua senha.',
            });
        } catch (error: unknown) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        const { token, newPassword } = req.body;

        try {
            await userService.resetPassword(token, newPassword);

            return res.status(200).json({
                message: 'Senha redefinida com sucesso.',
            });
        } catch (error: unknown) {
            next(error);
        }
    }
}

export const authController = new AuthController();
