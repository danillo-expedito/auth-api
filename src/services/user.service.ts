import { userRepository } from '../repositories/user.repository';
import bcrypt from 'bcryptjs';

export const userService = {
    registerUser: async (name: string, email: string, password: string) => {
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Invalid credentials');
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            password: hash,
        };

        const { password: _, ...userWithoutPassword } =
            await userRepository.create(newUser);

        return userWithoutPassword;
    },
};
