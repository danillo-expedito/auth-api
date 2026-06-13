import { Request, Response } from 'express';
import { userService } from '../services/user.service';

export const authController = {
    createUser: async (req: Request, res: Response) => {
        const { name, email, password } = req.body;

        try {
            const newUser = await userService.registerUser(
                name,
                email,
                password,
            );

            return res.status(201).json(newUser);
        } catch (error: unknown) {
            if (error instanceof Error) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
};
