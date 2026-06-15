import { Prisma } from '../generated/prisma';
import { prisma } from '../config/prisma';
import {
    IUser,
    IUserRegister,
    IUserResponse,
} from '../interfaces/user.interface';

export class UserRepository {
    async findByEmail(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        return user;
    }

    async findById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        return user;
    }

    async create(data: IUserRegister) {
        return await prisma.user.create({
            data,
        });
    }
}

export const userRepository = new UserRepository();
