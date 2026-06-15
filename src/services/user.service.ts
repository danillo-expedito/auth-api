import { userRepository } from '../repositories/user.repository';
import { IUserResponse } from '../interfaces/user.interface';
import { ConflictError } from '../errors/ConflictError';
import bcrypt from 'bcryptjs';

export class UserService {
    async registerUser(
        name: string,
        email: string,
        password: string,
    ): Promise<IUserResponse> {
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new ConflictError(
                'Este e-mail está registrado em outra conta.',
            );
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
    }
}

export const userService = new UserService();
